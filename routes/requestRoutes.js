const express = require('express');
const router = express.Router();
const Request = require('../models/request');
const User = require('../models/User'); 
const Inventory = require('../models/Inventory');

// 🟢 1. CREATE NEW REQUEST
router.post('/create', async (req, res) => {
  try {
    console.log("👉 STEP 1: Naya request aaya! Data:", req.body); 

    const newRequest = new Request(req.body);
    await newRequest.save();
    console.log("👉 STEP 2: Request database me save ho gayi!");

    // SOCKET.IO TRIGGER
    const io = req.app.get('socketio');
    if (io) {
      io.emit('newBloodRequest', {
        bloodGroup: newRequest.bloodGroup,
        hospitalName: newRequest.hospitalName,
        message: `Urgent! ${newRequest.bloodGroup} needed at ${newRequest.hospitalName}`
      });
    }

    // 🚀 GOOGLE APPS SCRIPT TRIGGER
    try {
      console.log(`👉 STEP 3: Pincode "${newRequest.pincode}" wale donors ko dhoondh rahe hain...`);
      
      const donors = await User.find({ 
        role: 'donor', 
        pincode: newRequest.pincode,
        bloodGroup: newRequest.bloodGroup
      });
      
      console.log(`👉 STEP 4: Total ${donors.length} donors mile is pincode mein!`);

      if (donors.length > 0) {
        const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw2lzysReqL01Hg1VAwGqi5HuLi25MJq_km9EyQilkVnzSZvxAJLn6fZxe6UoonIS5D/exec";

        console.log("👉 STEP 5: Donors ko personal email bhej rahe hain...");

        donors.forEach(donor => {
          if (!donor.email) return;

          const emailData = {
            to: donor.email,
            subject: `🚨 URGENT: ${newRequest.bloodGroup} Blood Required Near You!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #d32f2f; color: white; padding: 20px; text-align: center;">
                  <h2 style="margin: 0;">🚨 Urgent Blood Request</h2>
                  <p style="margin: 5px 0 0;">A patient near your location needs your help!</p>
                </div>
                <div style="padding: 25px; background-color: #ffffff; color: #333;">
                  <p>Hello <strong>${donor.name}</strong>,</p>
                  <p>An emergency blood request has been generated in your area.</p>
                  <div style="background-color: #fff5f5; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #d32f2f;">📋 Patient Details</h3>
                    <ul style="list-style-type: none; padding: 0; margin: 0; font-size: 15px;">
                      <li><strong>🩸 Blood Group Needed:</strong> ${newRequest.bloodGroup}</li>
                      <li><strong>👤 Patient Name:</strong> ${newRequest.patientName}</li>
                      <li><strong>🏥 Hospital Name:</strong> ${newRequest.hospitalName}</li>
                      <li><strong>📍 Location:</strong> ${newRequest.location}</li>
                      <li><strong>📞 Contact Number:</strong> ${newRequest.contactNumber}</li>
                      <li><strong>⚠️ Urgency Level:</strong> ${newRequest.urgency}</li>
                    </ul>
                  </div>
                  <p style="text-align: center; margin-top: 30px;">
                    <a href="https://lifelink.uno" style="background-color: #1976D2; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold;">View on LifeDaan</a>
                  </p>
                </div>
              </div>
            `
          };

          fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(emailData)
          })
          .then(response => response.text())
          .then(data => console.log(`✅ SUCCESS: Email sent to ${donor.name}`))
          .catch(err => console.log(`❌ ERROR sending to ${donor.name}:`, err));
        }); 

      } else {
        console.log("⚠️ CANCELLED: Is pincode mein koi donor nahi mila.");
      }
    } catch (emailErr) {
      console.log("❌ SYSTEM ERROR Email block mein:", emailErr);
    }

    res.status(201).json({ message: "Request generated!", request: newRequest });
  } catch (error) {
    console.log("❌ SERVER ERROR:", error);
    res.status(500).json({ message: "Server error while creating request." });
  }
});

// 🟢 2. GET ACTIVE REQUESTS BY PINCODE
router.get('/active/:pincode', async (req, res) => {
  try {
    const userPincode = req.params.pincode;
    
    const requests = await Request.find({ 
      status: { $in: ['pending', 'accepted'] },
      pincode: userPincode 
    }).sort({ createdAt: -1 });
    
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching requests." });
  }
});

// 🟢 3. ACCEPT BLOOD REQUEST (MULTI-DONOR / BACKUP SYSTEM)
router.put('/accept/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    const { donorName, donorContact, donorEmail } = req.body;

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (!request.acceptedDonors) request.acceptedDonors = [];

    const alreadyAccepted = request.acceptedDonors.some(donor => donor.donorEmail === donorEmail);
    if (alreadyAccepted) {
      return res.status(400).json({ message: "Aapne pehle hi is request ko accept kar liya hai!" });
    }

    request.acceptedDonors.push({ donorName, donorContact, donorEmail });
    request.status = 'accepted';
    const updatedRequest = await request.save();

    // ❌ YAHAN SE TIMER LOGIC HATA DIYA HAI. Ab sirf database me save hoga.

    res.status(200).json({ message: "Request accepted successfully!", request: updatedRequest });
  } catch (error) {
    res.status(500).json({ message: "Error accepting request." });
  }
});

// 🟢 4. GET MY REQUESTS (Patient/Hospital History)
router.get('/my-requests/:name', async (req, res) => {
  try {
    const userName = req.params.name;
    const requests = await Request.find({
      $or: [{ patientName: userName }, { hospitalName: userName }]
    }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching history." });
  }
});

// 🟢 5. GET HOSPITAL'S ACCEPTED MATCHES
router.get('/hospital-matches/:hospitalName', async (req, res) => {
  try {
    const hospitalName = req.params.hospitalName;
    const matches = await Request.find({ hospitalName: hospitalName, status: 'accepted' });
    res.status(200).json(matches);
  } catch (error) {
    res.status(500).json({ message: "Error fetching matches." });
  }
});

// 🟢 6. MARK REQUEST AS COMPLETED & AUTO-UPDATE STOCK
router.put('/complete/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    const { donorEmail } = req.body;

    const bloodRequest = await Request.findById(requestId);
    if (!bloodRequest) return res.status(404).json({ message: "Request not found" });

    bloodRequest.status = 'fulfilled';
    
    bloodRequest.donatedByEmail = donorEmail; 
    
    await bloodRequest.save();

    // Stock update logic
    if (bloodRequest.hospitalName) {
      const Inventory = require('../models/Inventory');
      await Inventory.findOneAndUpdate(
        { hospitalName: bloodRequest.hospitalName },
        { $inc: { [`stock.${bloodRequest.bloodGroup}`]: 1 } }
      );
    }

    // 90 days timmer start of donor
    if (donorEmail) {
      const User = require('../models/User');
      await User.findOneAndUpdate(
        { email: donorEmail },
        { lastDonationDate: new Date() }
      );
    }

    res.status(200).json({ message: "Donation verified! Donor's timer started.", request: bloodRequest });
  } catch (error) {
    res.status(500).json({ message: "Error completing request." });
  }
});

// 🟢 7. GET DONOR HISTORY
router.get('/donor-history/:email', async (req, res) => {
  try {
    const donorEmail = req.params.email;
    
    const history = await Request.find({ 
      donatedByEmail: donorEmail, 
      status: 'fulfilled' 
    }).sort({ updatedAt: -1 });
    
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: "Error fetching donor history." });
  }
});

module.exports = router;