const Feedback = require("../models/Feedback");

const CATEGORIES = ["general", "course", "teacher", "facilities", "app", "fees", "other"];
const CONTACT_STATUSES = ["new", "contacted", "resolved"];
const MAX_HOMEPAGE_TESTIMONIALS = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toPublicFeedback = (doc) => ({
  _id: doc._id,
  category: doc.category,
  rating: doc.rating,
  subject: doc.subject,
  message: doc.message,
  isTestimonial: doc.isTestimonial,
  approvedForHomepage: doc.approvedForHomepage,
  isContactInquiry: doc.isContactInquiry,
  createdAt: doc.createdAt,
});

const toAdminFeedback = (doc) => {
  const base = toPublicFeedback(doc);

  if (doc.isContactInquiry) {
    return {
      ...base,
      contact: {
        name: doc.contactName,
        email: doc.contactEmail,
        phone: doc.contactPhone,
        status: doc.contactStatus,
      },
    };
  }

  if (doc.isTestimonial && doc.submittedBy) {
    return {
      ...base,
      student: {
        name: doc.submittedBy.name,
        avatar: doc.submittedBy.avatar,
      },
    };
  }

  return base;
};

const applyTypeFilter = (filter, type) => {
  if (type === "testimonial") {
    filter.isTestimonial = true;
    filter.isContactInquiry = { $ne: true };
  } else if (type === "contact") {
    filter.isContactInquiry = true;
  } else if (type === "feedback") {
    filter.isTestimonial = { $ne: true };
    filter.isContactInquiry = { $ne: true };
  }
};

const submitFeedback = async (req, res) => {
  try {
    const { category, rating, subject, message, isTestimonial } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: "Feedback message is required" });
    }

    if (category && !CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: "Invalid category" });
    }

    const parsedRating = rating ? parseInt(rating, 10) : undefined;
    if (parsedRating && (parsedRating < 1 || parsedRating > 5)) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const testimonial = Boolean(isTestimonial);
    if (testimonial && (!parsedRating || parsedRating < 1)) {
      return res.status(400).json({ success: false, message: "Star rating is required for testimonials" });
    }

    const feedback = await Feedback.create({
      submittedBy: req.user._id,
      category: category || "general",
      rating: parsedRating,
      subject: subject?.trim() || "",
      message: message.trim(),
      isTestimonial: testimonial,
    });

    res.status(201).json({
      success: true,
      message: testimonial
        ? "Thank you! Your testimonial has been submitted for admin review."
        : "Thank you! Your anonymous feedback has been submitted.",
      data: toPublicFeedback(feedback),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitContactInquiry = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Your name is required" });
    }
    if (!email?.trim() || !EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ success: false, message: "A valid email address is required" });
    }
    if (!phone?.trim()) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const inquiry = await Feedback.create({
      category: "contact",
      isContactInquiry: true,
      contactName: name.trim(),
      contactEmail: email.trim().toLowerCase(),
      contactPhone: phone.trim(),
      subject: subject?.trim() || "",
      message: message.trim(),
      contactStatus: "new",
    });

    res.status(201).json({
      success: true,
      message: "Thank you! We received your message and will contact you soon.",
      data: toPublicFeedback(inquiry),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminFeedback = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 6);
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.query.category && CATEGORIES.includes(req.query.category)) {
      filter.category = req.query.category;
    }

    if (req.query.type) {
      applyTypeFilter(filter, req.query.type);
    }

    const [items, total, categoryCounts, approvedCount, newContactCount] = await Promise.all([
      Feedback.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("submittedBy", "name avatar email phone"),
      Feedback.countDocuments(filter),
      Feedback.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
      Feedback.countDocuments({ isTestimonial: true, approvedForHomepage: true }),
      Feedback.countDocuments({ isContactInquiry: true, contactStatus: "new" }),
    ]);

    const avgRating = await Feedback.aggregate([
      { $match: { rating: { $exists: true, $ne: null }, isContactInquiry: { $ne: true } } },
      { $group: { _id: null, avg: { $avg: "$rating" } } },
    ]);

    res.json({
      success: true,
      data: {
        feedback: items.map(toAdminFeedback),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        stats: {
          total: await Feedback.countDocuments(),
          avgRating: avgRating[0]?.avg ? Math.round(avgRating[0].avg * 10) / 10 : null,
          byCategory: Object.fromEntries(categoryCounts.map((c) => [c._id, c.count])),
          approvedTestimonials: approvedCount,
          maxHomepageTestimonials: MAX_HOMEPAGE_TESTIMONIALS,
          newContactInquiries: newContactCount,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPublicTestimonials = async (req, res) => {
  try {
    const items = await Feedback.find({
      isTestimonial: true,
      approvedForHomepage: true,
      rating: { $gte: 1 },
    })
      .sort({ updatedAt: -1 })
      .limit(MAX_HOMEPAGE_TESTIMONIALS)
      .populate("submittedBy", "name avatar");

    res.json({
      success: true,
      data: {
        testimonials: items.map((doc) => ({
          _id: doc._id,
          message: doc.message,
          rating: doc.rating,
          student: {
            name: doc.submittedBy?.name || "Student",
            avatar: doc.submittedBy?.avatar,
          },
          createdAt: doc.createdAt,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleTestimonialApproval = async (req, res) => {
  try {
    const { approved } = req.body;
    const feedback = await Feedback.findById(req.params.id).populate("submittedBy", "name avatar");

    if (!feedback) {
      return res.status(404).json({ success: false, message: "Feedback not found" });
    }

    if (!feedback.isTestimonial) {
      return res.status(400).json({ success: false, message: "Only testimonials can be featured on the homepage" });
    }

    if (!feedback.rating || feedback.rating < 1) {
      return res.status(400).json({ success: false, message: "Testimonial must have a star rating" });
    }

    const nextApproved = Boolean(approved);

    if (nextApproved && !feedback.approvedForHomepage) {
      const count = await Feedback.countDocuments({ approvedForHomepage: true, isTestimonial: true });
      if (count >= MAX_HOMEPAGE_TESTIMONIALS) {
        return res.status(400).json({
          success: false,
          message: `Maximum ${MAX_HOMEPAGE_TESTIMONIALS} testimonials can appear on the homepage`,
        });
      }
    }

    feedback.approvedForHomepage = nextApproved;
    await feedback.save();

    res.json({
      success: true,
      message: nextApproved ? "Testimonial approved for homepage" : "Testimonial removed from homepage",
      data: toAdminFeedback(feedback),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!CONTACT_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid contact status" });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: "Contact inquiry not found" });
    }
    if (!feedback.isContactInquiry) {
      return res.status(400).json({ success: false, message: "This item is not a contact inquiry" });
    }

    feedback.contactStatus = status;
    await feedback.save();

    res.json({
      success: true,
      message: "Contact status updated",
      data: toAdminFeedback(feedback),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Feedback not found" });
    }
    res.json({ success: true, message: "Feedback deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitFeedback,
  submitContactInquiry,
  getAdminFeedback,
  getPublicTestimonials,
  toggleTestimonialApproval,
  updateContactStatus,
  deleteFeedback,
  CATEGORIES,
  CONTACT_STATUSES,
  MAX_HOMEPAGE_TESTIMONIALS,
};