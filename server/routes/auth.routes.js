const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { User, Organization, Membership, Project } = require("../models");
const { rbac, ROLES } = require("../middleware/rbac");

const JWT_SECRET = process.env.JWT_SECRET || "pulse-trace-secret-key-2024";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "pulse-trace-refresh-key-2024";

// Helper to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const sequelize = require("../database/database");

// POST /auth/signup
router.post("/signup", async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { email, password, name, orgName } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: "User already exists" });
    }

    // 1. Create User
    const user = await User.create({ email, password, name }, { transaction });
    
    // 2. Create Default Organization
    const org = await Organization.create({ 
      name: orgName || `${name}'s Org`,
      slug: (orgName || name).toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(7)
    }, { transaction });
    
    // 3. Create Membership as OWNER
    // Use both casing variants for UserId/OrganizationId just in case of different sequelize behaviors
    await Membership.create({
      UserId: user.id,
      OrganizationId: org.id,
      role: 'OWNER'
    }, { transaction });

    // 4. Create Default Project
    const project = await Project.create({
      name: 'Default Project',
      OrganizationId: org.id
    }, { transaction });

    await transaction.commit();

    const { accessToken, refreshToken } = generateTokens(user);
    
    res.status(201).json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      org: { id: org.id, name: org.name },
      project: { id: project.id, name: project.name, apiKey: project.apiKey },
      accessToken,
      refreshToken
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Signup Error:", error);
    res.status(400).json({ 
      success: false, 
      error: error.name === 'SequelizeValidationError' ? error.errors[0].message : error.message 
    });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    
    // Fetch user's organizations and projects
    const memberships = await Membership.findAll({
      where: { UserId: user.id },
      include: [{
        model: Organization,
        include: [Project]
      }]
    });

    const orgs = memberships.map(m => ({
      org: m.Organization,
      role: m.role,
      projects: m.Organization.Projects
    }));

    res.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      orgs,
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /auth/refresh
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ success: false });

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) throw new Error();

    const tokens = generateTokens(user);
    res.json({ success: true, ...tokens });
  } catch (e) {
    res.status(403).json({ success: false, error: "Invalid refresh token" });
  }
});

module.exports = router;
