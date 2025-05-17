const Property = require('../models/Property');

exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).lean();
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    } 
    // Ensure ownerEmail or createdBy is present
    const response = {
      ...property,
      ownerId: property.ownerId || null,
      ownerEmail: property.ownerEmail || property.createdBy || null,
      ownerName: property.ownerName || 'Unknown Owner',
      ownerPicture: property.ownerPicture || null,
    };
    console.log('Returning property:', response);
    res.json(response);
  } catch (error) {
    console.error('Error fetching property:', error.message, error.stack);
    res.status(500).json({ error: 'Server error fetching property' });
  }
};

exports.getProperties = async (req, res) => {
  try {
    const properties = await Property.find({ isHidden: false }).lean();
    const enrichedProperties = properties.map((property) => ({
      ...property,
      ownerId: property.ownerId || null,
      ownerEmail: property.ownerEmail || property.createdBy || null,
      ownerName: property.ownerName || 'Unknown Owner',
      ownerPicture: property.ownerPicture || null,
    }));
    res.json(enrichedProperties);
  } catch (error) {
    console.error('Error fetching properties:', error.message, error.stack);
    res.status(500).json({ error: 'Server error fetching properties' });
  }
};
// propertyController.js
exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const property = await Property.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    console.error('Error updating property:', error.message, error.stack);
    res.status(400).json({ error: `Failed to update property: ${error.message}` });
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findByIdAndDelete(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error.message, error.stack);
    res.status(500).json({ error: 'Server error deleting property' });
  }
};

exports.createProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      addressLine1,
      addressLine2,
      cityTown,
      upazila,
      district,
      postalCode,
      propertyType,
      listingType,
      bedrooms,
      bathrooms,
      area,
      features,
      bangladeshDetails,
      images,
    } = req.body;

    const property = new Property({
      title,
      description,
      price,
      addressLine1,
      addressLine2,
      cityTown,
      upazila,
      district,
      postalCode,
      propertyType,
      listingType: listingType || 'rent',
      bedrooms: bedrooms || 0,
      bathrooms: bathrooms || 0,
      area,
      features: {
        parking: features?.parking || false,
        garden: features?.garden || false,
        airConditioning: features?.airConditioning || false,
        furnished: features?.furnished || 'no',
        pool: features?.pool || false,
      },
      bangladeshDetails: {
        propertyCondition: bangladeshDetails?.propertyCondition || null,
        proximityToMainRoad: bangladeshDetails?.proximityToMainRoad || null,
        publicTransport: bangladeshDetails?.publicTransport || null,
        floodProne: bangladeshDetails?.floodProne || null,
        waterSource: bangladeshDetails?.waterSource || null,
        gasSource: bangladeshDetails?.gasSource || null,
        gasLineInstalled: bangladeshDetails?.gasLineInstalled || null,
        backupPower: bangladeshDetails?.backupPower || null,
        sewerSystem: bangladeshDetails?.sewerSystem || null,
        nearbySchools: bangladeshDetails?.nearbySchools || null,
        nearbyHospitals: bangladeshDetails?.nearbyHospitals || null,
        nearbyMarkets: bangladeshDetails?.nearbyMarkets || null,
        nearbyReligiousPlaces: bangladeshDetails?.nearbyReligiousPlaces || null,
        nearbyOthers: bangladeshDetails?.nearbyOthers || null,
        securityFeatures: bangladeshDetails?.securityFeatures || [],
        earthquakeResistance: bangladeshDetails?.earthquakeResistance || null,
        roadWidth: bangladeshDetails?.roadWidth || null,
        parkingType: bangladeshDetails?.parkingType || null,
        floorNumber: bangladeshDetails?.floorNumber || null,
        totalFloors: bangladeshDetails?.totalFloors || null,
        balcony: bangladeshDetails?.balcony || null,
        rooftopAccess: bangladeshDetails?.rooftopAccess || null,
        naturalLight: bangladeshDetails?.naturalLight || null,
        ownershipPapers: bangladeshDetails?.ownershipPapers || null,
        propertyTenure: bangladeshDetails?.propertyTenure || null,
        recentRenovations: bangladeshDetails?.recentRenovations || null,
        nearbyDevelopments: bangladeshDetails?.nearbyDevelopments || null,
        reasonForSelling: bangladeshDetails?.reasonForSelling || null,
      },
      images: images || [],
      ownerId: req.user.sub,
      ownerEmail: req.user.email,
      ownerName: req.user.name || 'Unknown',
      ownerPicture: req.user.picture || null,
      createdBy: req.user.email,
    });

    await property.save();
    res.status(201).json(property);
  } catch (error) {
    console.error('Error creating property:', error.message, error.stack);
    res.status(400).json({ error: `Failed to create property: ${error.message}` });
  }
};