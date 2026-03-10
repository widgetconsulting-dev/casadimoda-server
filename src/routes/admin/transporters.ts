import { Router, Request, Response } from "express";
import bcryptjs from "bcryptjs";
import db from "../../utils/db";
import User from "@/models/User";
import TransporterCompany from "@/models/TransporterCompany";
import { authenticate } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/requireRole";

const router = Router();

// GET /api/admin/transporters
router.get("/", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    await db.connect();
    const transporters = await User.find({ role: "transporter" })
      .select("_id name email transporterCompanyId")
      .populate("transporterCompanyId", "companyName companySlug phone contactEmail address coverageAreas logo website trackingUrl description status")
      .lean();
    res.json(
      transporters.map((t) => {
        const c = t.transporterCompanyId as Record<string, any> | null;
        return {
          _id: t._id.toString(),
          name: t.name,
          email: t.email,
          company: c ? {
            _id: c._id.toString(),
            companyName: c.companyName,
            companySlug: c.companySlug,
            description: c.description,
            phone: c.phone,
            contactEmail: c.contactEmail,
            address: c.address,
            coverageAreas: c.coverageAreas,
            logo: c.logo,
            website: c.website,
            trackingUrl: c.trackingUrl,
            status: c.status,
          } : null,
        };
      })
    );
  } catch (err) {
    console.error("[GET /api/admin/transporters]", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/admin/transporters
router.post("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, email, password, companyName, companySlug, description, logo, phone, contactEmail, website, trackingUrl, address, coverageAreas } = req.body;
    if (!name || !email || !password || !companyName || !phone) {
      res.status(400).json({ message: "Missing required fields" }); return;
    }
    await db.connect();
    if (await User.findOne({ email })) { res.status(400).json({ message: "Email already in use" }); return; }
    const slug = companySlug || companyName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (await TransporterCompany.findOne({ companySlug: slug })) { res.status(400).json({ message: "Company slug already in use" }); return; }
    const user = await User.create({ name, email, password: bcryptjs.hashSync(password, 10), isAdmin: false, role: "transporter" });
    const company = await TransporterCompany.create({
      user: user._id, companyName, companySlug: slug,
      description: description || "", logo: logo || "", phone,
      contactEmail: contactEmail || email, website: website || "",
      trackingUrl: trackingUrl || "",
      address: address || { street: "", city: "", postalCode: "", country: "Tunisie" },
      coverageAreas: coverageAreas || [], status: "active",
    });
    await User.findByIdAndUpdate(user._id, { transporterCompanyId: company._id });
    res.status(201).json({ message: "Transporter created", _id: user._id.toString() });
  } catch (err) {
    console.error("[POST /api/admin/transporters]", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/admin/transporters/:id
router.put("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { companyName, description, logo, phone, contactEmail, website, trackingUrl, address, coverageAreas, status, name } = req.body;
    await db.connect();
    const company = await TransporterCompany.findById(id);
    if (!company) { res.status(404).json({ message: "Company not found" }); return; }
    if (companyName !== undefined) company.companyName = companyName;
    if (description !== undefined) company.description = description;
    if (logo !== undefined) company.logo = logo;
    if (phone !== undefined) company.phone = phone;
    if (contactEmail !== undefined) company.contactEmail = contactEmail;
    if (website !== undefined) company.website = website;
    if (trackingUrl !== undefined) company.trackingUrl = trackingUrl;
    if (address !== undefined) company.address = address;
    if (coverageAreas !== undefined) company.coverageAreas = coverageAreas;
    if (status !== undefined) company.status = status;
    await company.save();
    if (name !== undefined) await User.findByIdAndUpdate(company.user, { name });
    res.json({ message: "Company updated" });
  } catch (err) {
    console.error("[PUT /api/admin/transporters/:id]", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/admin/transporters/:id
router.delete("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.connect();
    const company = await TransporterCompany.findById(id);
    if (!company) { res.status(404).json({ message: "Company not found" }); return; }
    await User.findByIdAndDelete(company.user);
    await TransporterCompany.findByIdAndDelete(id);
    res.json({ message: "Company deleted" });
  } catch (err) {
    console.error("[DELETE /api/admin/transporters/:id]", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
