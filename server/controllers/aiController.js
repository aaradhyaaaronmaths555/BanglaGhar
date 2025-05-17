// server/controllers/aiController.js

const OpenAI = require("openai");

// Configure OpenAI client from env
const openai = new OpenAI({
  baseURL: process.env.OPENAI_API_BASE_URL || "https://api.aimlapi.com/v1", // Default to aimlapi if needed
  apiKey: process.env.AIML_API_KEY || process.env.OPENAI_API_KEY, // Check both potential env var names
});

// Helper function to safely access nested properties
const getSafe = (obj, path, defaultValue = "N/A") => {
  const keys = path.split(".");
  let result = obj;
  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = result[key];
    } else {
      return defaultValue; // Return default if path is invalid or value is null/undefined
    }
  }
  // Handle cases where the final value might be null/undefined/empty string
  return result !== null && result !== undefined && result !== ""
    ? result
    : defaultValue;
};

// Helper function to format features for the prompt
const formatFeaturesForPrompt = (features = {}) => {
  let featureString = "";
  if (features.parking === true) featureString += "- Parking Available\n";
  if (features.garden === true) featureString += "- Garden Area\n";
  if (features.airConditioning === true)
    featureString += "- Air Conditioning\n";
  if (features.pool === true) featureString += "- Swimming Pool\n";
  if (features.furnished && features.furnished !== "no")
    featureString += `- Furnished: ${features.furnished}\n`;
  // Add other boolean features from your `features` object here...
  return featureString || "N/A"; // Return N/A if no features listed
};

// Helper function to format Bangladesh-specific details for the prompt
const formatBangladeshDetailsForPrompt = (bdDetails = {}) => {
  let detailString = "";
  if (getSafe(bdDetails, "propertyCondition") !== "N/A")
    detailString += `- Condition: ${getSafe(bdDetails, "propertyCondition")}\n`;
  if (getSafe(bdDetails, "waterSource") !== "N/A")
    detailString += `- Water Source: ${getSafe(bdDetails, "waterSource")}\n`;
  if (getSafe(bdDetails, "gasSource") !== "N/A")
    detailString += `- Gas Source: ${getSafe(bdDetails, "gasSource")} ${
      bdDetails.gasSource === "piped"
        ? `(Line Installed: ${getSafe(
            bdDetails,
            "gasLineInstalled",
            "Unknown"
          )})`
        : ""
    }\n`;
  if (
    getSafe(bdDetails, "backupPower") !== "N/A" &&
    getSafe(bdDetails, "backupPower") !== "none"
  )
    detailString += `- Backup Power: ${getSafe(bdDetails, "backupPower")}\n`;
  if (
    getSafe(bdDetails, "parkingType") !== "N/A" &&
    getSafe(bdDetails, "parkingType") !== "none"
  )
    detailString += `- Parking: ${getSafe(bdDetails, "parkingType")}\n`;
  if (
    Array.isArray(bdDetails.securityFeatures) &&
    bdDetails.securityFeatures.length > 0
  )
    detailString += `- Security: ${bdDetails.securityFeatures.join(", ")}\n`;
  if (getSafe(bdDetails, "nearbySchools") !== "N/A")
    detailString += `- Nearby Schools: ${getSafe(
      bdDetails,
      "nearbySchools"
    )}\n`;
  if (getSafe(bdDetails, "nearbyHospitals") !== "N/A")
    detailString += `- Nearby Hospitals: ${getSafe(
      bdDetails,
      "nearbyHospitals"
    )}\n`;
  if (getSafe(bdDetails, "nearbyMarkets") !== "N/A")
    detailString += `- Nearby Markets: ${getSafe(
      bdDetails,
      "nearbyMarkets"
    )}\n`;
  // Add other important details from bdDetails here...
  if (getSafe(bdDetails, "balcony") === "yes")
    detailString += `- Balcony Available\n`;
  if (getSafe(bdDetails, "rooftopAccess") === "yes")
    detailString += `- Rooftop Access\n`;
  if (getSafe(bdDetails, "naturalLight") !== "N/A")
    detailString += `- Natural Light: ${getSafe(bdDetails, "naturalLight")}\n`;
  if (getSafe(bdDetails, "roadWidth") !== "N/A")
    detailString += `- Road Width: ${getSafe(bdDetails, "roadWidth")}\n`;

  return detailString || "N/A"; // Return N/A if no specific details provided
};

const generatePropertyDescription = async (req, res) => {
  try {
    // Debug: Log the language received from frontend
    console.log("[AIController] Received language:", req.body.language);

    // Access the nested propertyData object sent from the frontend
    const propertyDataFromRequest = req.body.propertyData;
    const language = req.body.language || "en"; // Default to English
    if (
      !propertyDataFromRequest ||
      typeof propertyDataFromRequest !== "object"
    ) {
      return res.status(400).json({ error: "Invalid property data received" });
    }

    // Extract data using safe getter, accessing the correct nested structure
    const basicInfo = propertyDataFromRequest.basicInfo || {};
    const location = propertyDataFromRequest.location || {};
    const features = propertyDataFromRequest.features || {};
    const bdDetails = propertyDataFromRequest.bangladeshDetails || {};

    // --- Build the NEW, Detailed Prompt ---
    let prompt = "";
    if (language === "bn") {
      prompt = `আপনি বাংলাদেশের বাজারের জন্য একজন দক্ষ রিয়েল এস্টেট কপিরাইটার। নিচের তথ্যের ভিত্তিতে বাংলায় ১৫০-২০০ শব্দের একটি আকর্ষণীয়, আবেগঘন ও মনোমুগ্ধকর সম্পত্তির বিবরণ লিখুন।
- তথ্যগুলোকে সংলগ্ন ও প্রাসঙ্গিকভাবে ব্যবহার করুন, যেন বর্ণনাটি স্বাভাবিক ও মানবিক শোনায়।
- বাড়ির পরিবেশ, সুযোগ-সুবিধা, এবং আশেপাশের বৈশিষ্ট্যগুলো এমনভাবে তুলে ধরুন, যেন পাঠক নিজেকে এখানে বসবাস করতে কল্পনা করতে পারে।
- ভাষা যেন সাবলীল, আন্তরিক ও আমন্ত্রণমূলক হয়, অপ্রয়োজনীয় অতিরঞ্জন বা প্রচলিত বাক্য (যেমন: "শহরের প্রাণকেন্দ্রে") এড়িয়ে চলুন।
- শুধুমাত্র দেওয়া তথ্য ব্যবহার করুন, নতুন কিছু যোগ করবেন না।
- নীচের সুযোগ-সুবিধা ও বিবরণাদি ইংরেজিতে দেওয়া হয়েছে, আপনি বাংলায় অনুবাদ করে বর্ণনায় ব্যবহার করুন।
`;
    } else {
      prompt = `You are an expert real estate copywriter for the Bangladeshi market. Write a captivating, emotionally engaging, and highly appealing property description (150-200 words) for the listing below.\n- Paint a vivid picture of the lifestyle, comfort, and unique advantages this property offers.\n- Highlight what makes this home stand out, using expressive and inviting language.\n- Mention the ambiance, neighborhood vibe, and any special features that would excite buyers or renters.\n- Make the reader imagine living here and feeling at home.\n- Use a warm, story-like tone, not just a list of facts.\n- Do not invent details not provided.\n`;
    }
    prompt += `\n**Property Overview:**\n- Title: ${getSafe(basicInfo, "title")}\n- Property Type: ${getSafe(basicInfo, "propertyType")}\n- Listing Type: For ${getSafe(basicInfo, "listingType")}\n- Price: ${getSafe(basicInfo, "price")} BDT ${basicInfo.listingType === "rent" ? "/month" : ""}\n- Size: ${getSafe(basicInfo, "area")} sqft\n- Bedrooms: ${getSafe(basicInfo, "bedrooms", "N/A (Land/Commercial)")}\n- Bathrooms: ${getSafe(basicInfo, "bathrooms", "N/A (Land/Commercial)")}\n\n**Location:**\n- Address: ${getSafe(location, "addressLine1")}${location.addressLine2 ? `, ${location.addressLine2}` : ""}\n- Area/Town: ${getSafe(location, "cityTown")}\n- Upazila/Thana: ${getSafe(location, "upazila")}\n- District: ${getSafe(location, "district")}\n- Postal Code: ${getSafe(location, "postalCode")}\n\n**Standard Features:**\n${formatFeaturesForPrompt(features)}\n\n**Specific Details & Local Context:**\n${formatBangladeshDetailsForPrompt(bdDetails)}\n`;
    // --- End of Improved Prompt ---

    console.log("---- Sending Prompt to AI ----\n", prompt); // Log the prompt for debugging

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            language === "bn"
              ? "আপনি একজন সহায়ক সহকারী, বাংলাদেশের বাজারের জন্য বাংলায় আকর্ষণীয় সম্পত্তির বিবরণ লিখছেন। নোট করুন: সুযোগ-সুবিধা ও অন্যান্য তথ্য ইংরেজিতে দেওয়া হয়েছে, আপনি বাংলায় অনুবাদ করে বর্ণনায় ব্যবহার করুন।"
              : "You are a helpful assistant writing compelling property descriptions for the Bangladeshi market based on provided details.",
        },
        { role: "user", content: prompt },
      ],
      model: process.env.AI_MODEL || "gpt-3.5-turbo", // Use a widely available model for compatibility
      // max_tokens: 250, // Optional: Limit response length
      // temperature: 0.7, // Optional: Adjust creativity
    });

    if (completion?.choices?.[0]?.message?.content) {
      console.log(
        "---- AI Response Received ----\n",
        completion.choices[0].message.content
      ); // Log response
      res.json({ description: completion.choices[0].message.content.trim() });
    } else {
      console.error("Invalid response structure from AI API:", completion);
      throw new Error("Invalid response structure from AI API");
    }
  } catch (error) {
    console.error(
      "AI Description Error:",
      error?.response?.data || error?.message || error
    );
    res.status(500).json({
      error: "Failed to generate property description",
      details: error?.message || "Unknown AI service error",
    });
  }
};

exports.generateDescription = generatePropertyDescription;
