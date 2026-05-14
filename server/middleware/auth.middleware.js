const jwt = require("jsonwebtoken");
const { User, Membership, Organization } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "pulse-trace-secret-key-2024";

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    req.user = user;
    
    // Inject active organization context if provided in header
    const activeOrgId = req.headers['x-org-id'];
    if (activeOrgId) {
      const membership = await Membership.findOne({
        where: { UserId: user.id, OrganizationId: activeOrgId },
        include: [Organization]
      });
      
      if (membership) {
        req.organization = membership.Organization;
        req.userRole = membership.role;
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
};

module.exports = authenticate;
