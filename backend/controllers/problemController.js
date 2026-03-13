const ProblemStatement = require("../models/ProblemStatement");
const Team = require("../models/Team");
const Settings = require("../models/Settings");

const MAX_TEAMS_PER_PROBLEM = 5;

// @desc Get all problem statements
// @route GET /api/problems
exports.getProblems = async (req, res, next) => {
  try {
    const settings = await Settings.findOne().lean();
    const isOpen = settings?.problemStatementsOpen !== false;

    if (req.user?.role === "team" && !isOpen) {
      return res
        .status(403)
        .json({ message: "Problem statement selection is currently closed." });
    }

    const problems = await ProblemStatement.find({ visible: true }).lean();
    const problemIds = problems.map((problem) => problem._id);

    let selectionCountsByProblemId = new Map();
    if (problemIds.length > 0) {
      const selectionCounts = await Team.aggregate([
        { $match: { problemStatement: { $in: problemIds } } },
        { $group: { _id: "$problemStatement", count: { $sum: 1 } } },
      ]);

      selectionCountsByProblemId = new Map(
        selectionCounts.map((item) => [String(item._id), item.count]),
      );
    }

    const enrichedProblems = problems.map((problem) => {
      const selectionCount =
        selectionCountsByProblemId.get(String(problem._id)) || 0;
      const slotsRemaining = Math.max(
        MAX_TEAMS_PER_PROBLEM - selectionCount,
        0,
      );

      return {
        ...problem,
        maxTeams: MAX_TEAMS_PER_PROBLEM,
        selectionCount,
        slotsRemaining,
        isFull: slotsRemaining === 0,
      };
    });

    res.json(enrichedProblems);
  } catch (error) {
    next(error);
  }
};

// @desc Create a problem statement
// @route POST /api/problems
exports.createProblem = async (req, res, next) => {
  const { title, domain, difficulty, description } = req.body;
  try {
    if (!title || !domain || !difficulty || !description) {
      return res.status(400).json({
        message:
          "All fields (title, domain, difficulty, description) are required",
      });
    }
    if (!["Easy", "Medium", "Hard"].includes(difficulty)) {
      return res
        .status(400)
        .json({ message: "Difficulty must be Easy, Medium, or Hard" });
    }
    const problem = await ProblemStatement.create({
      title,
      domain,
      difficulty,
      description,
    });
    res.status(201).json(problem);
  } catch (error) {
    next(error);
  }
};

// @desc Select a problem for a team
// @route POST /api/problems/select
exports.selectProblem = async (req, res, next) => {
  const { problemId } = req.body;
  const teamId = req.user.id; // From auth middleware

  try {
    const settings = await Settings.findOne().lean();
    const isOpen = settings?.problemStatementsOpen !== false;
    if (!isOpen) {
      return res
        .status(403)
        .json({ message: "Problem statement selection is currently closed." });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.problemStatement) {
      return res
        .status(400)
        .json({ message: "Problem statement already selected" });
    }

    const problem = await ProblemStatement.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const selectedTeamCount = await Team.countDocuments({
      problemStatement: problemId,
    });
    if (selectedTeamCount >= MAX_TEAMS_PER_PROBLEM) {
      return res.status(400).json({
        message: `This problem statement has reached its limit of ${MAX_TEAMS_PER_PROBLEM} teams.`,
      });
    }

    team.problemStatement = problemId;
    await team.save();

    res.json({
      message: `Problem "${problem.title}" selected successfully`,
      problem,
    });
  } catch (error) {
    next(error);
  }
};
