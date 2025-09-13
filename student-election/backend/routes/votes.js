const express = require('express');
const Vote = require('../models/Vote');
const User = require('../models/User');
const Nominee = require('../models/Nominee');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// POST /api/votes - Cast a vote
router.post('/', auth, async (req, res) => {
  const { nomineeId, position } = req.body;
  try {
    const userId = req.user.id;

    // Check if user already voted for this position
    const existingVote = await Vote.findOne({ user: userId, position });
    if (existingVote) {
      return res.status(400).json({ msg: `You have already voted for ${position}` });
    }

    const nominee = await Nominee.findById(nomineeId);
    if (!nominee || nominee.position !== position || !nominee.approved) {
      return res.status(400).json({ msg: 'Invalid nominee' });
    }

    // Save vote with correct field names
    const vote = new Vote({ user: userId, nominee: nomineeId, position });
    await vote.save();

    // Increment nominee votes
    nominee.votes = (nominee.votes || 0) + 1;
    await nominee.save();

    res.json(nominee); // Return updated nominee to frontend
  } catch (error) {
    console.error("Vote route error:", error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/votes/results - Admin view results
router.get('/results', auth, adminAuth, async (req, res) => {
  try {
    const votes = await Vote.aggregate([
      { $group: { _id: { nomineeId: '$nominee', position: '$position' }, count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'nominees',
          localField: '_id.nomineeId',
          foreignField: '_id',
          as: 'nominee',
        },
      },
      { $unwind: '$nominee' },
    ]);
    res.json(votes);
  } catch (error) {
    console.error("Vote results error:", error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
