const express = require("express");
const router = express.Router();
const { Organization, Project, Membership, User } = require("../models");
const authenticate = require("../middleware/auth.middleware");
const { rbac, ROLES } = require("../middleware/rbac");

router.use(authenticate);

// GET /orgs - Get user's organizations
router.get("/", async (req, res) => {
  try {
    const memberships = await Membership.findAll({
      where: { UserId: req.user.id },
      include: [Organization]
    });
    res.json({ success: true, data: memberships.map(m => ({ 
      org: m.Organization, 
      role: m.role 
    })) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /orgs/:orgId/projects - Create a new project
router.post("/:orgId/projects", rbac('MANAGE_PROJECTS'), async (req, res) => {
  try {
    const { name } = req.body;
    const project = await Project.create({ 
      name, 
      OrganizationId: req.params.orgId 
    });
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /orgs/:orgId/projects - Get projects in org
router.get("/:orgId/projects", rbac('VIEW_METRICS'), async (req, res) => {
  try {
    const projects = await Project.findAll({ 
      where: { OrganizationId: req.params.orgId } 
    });
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /orgs/:orgId/invitations - Invite a user
router.post("/:orgId/invitations", rbac('MANAGE_ORG'), async (req, res) => {
  try {
    const { email, role } = req.body;
    const invitation = await require("../models/Invitation").create({
      email,
      role,
      token: require('crypto').randomBytes(32).toString('hex'),
      OrganizationId: req.params.orgId
    });
    // In a real app, send email here
    res.status(201).json({ success: true, data: invitation });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /invitations/:token/accept - Accept invitation
router.post("/invitations/accept", async (req, res) => {
  try {
    const { token } = req.body;
    const Invitation = require("../models/Invitation");
    const inv = await Invitation.findOne({ where: { token, status: 'PENDING' } });
    
    if (!inv) return res.status(404).json({ success: false, error: "Invalid invitation" });

    await Membership.create({
      UserId: req.user.id,
      OrganizationId: inv.OrganizationId,
      role: inv.role
    });

    inv.status = 'ACCEPTED';
    await inv.save();

    res.json({ success: true, message: "Invitation accepted" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
