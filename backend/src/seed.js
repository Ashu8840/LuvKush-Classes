require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const StudentProfile = require("./models/StudentProfile");
const TeacherProfile = require("./models/TeacherProfile");
const Course = require("./models/Course");
const Batch = require("./models/Batch");
const Attendance = require("./models/Attendance");
const Fee = require("./models/Fee");
const Exam = require("./models/Exam");
const Notification = require("./models/Notification");
const Library = require("./models/Library");
const Certificate = require("./models/Certificate");
const ParentLink = require("./models/ParentLink");
const ShorthandDictation = require("./models/ShorthandDictation");
const ShorthandAttempt = require("./models/ShorthandAttempt");
const PracticeSession = require("./models/PracticeSession");
const ExamAttempt = require("./models/ExamAttempt");
const Payment = require("./models/Payment");
const DeviceToken = require("./models/DeviceToken");

const courses = [
  { name: "Shorthand 80 WPM", slug: "shorthand-80", category: "shorthand", level: "80 WPM", fee: 8000, duration: "3 months" },
  { name: "Shorthand 100 WPM", slug: "shorthand-100", category: "shorthand", level: "100 WPM", fee: 10000, duration: "4 months" },
  { name: "Shorthand 120 WPM", slug: "shorthand-120", category: "shorthand", level: "120 WPM", fee: 12000, duration: "5 months" },
  { name: "Shorthand 140 WPM", slug: "shorthand-140", category: "shorthand", level: "140 WPM", fee: 15000, duration: "6 months" },
  { name: "Hindi Typing", slug: "hindi-typing", category: "typing", level: "Beginner", fee: 5000, duration: "2 months" },
  { name: "English Typing", slug: "english-typing", category: "typing", level: "Beginner", fee: 5000, duration: "2 months" },
  { name: "Computer Basics", slug: "computer-basics", category: "computer", level: "Foundation", fee: 4000, duration: "1 month" },
  { name: "CCC Preparation", slug: "ccc-prep", category: "ccc", level: "Exam Prep", fee: 6000, duration: "2 months" },
];

const seed = async () => {
  try {
    await connectDB();

    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Batch.deleteMany({}),
      StudentProfile.deleteMany({}),
      TeacherProfile.deleteMany({}),
      Attendance.deleteMany({}),
      Fee.deleteMany({}),
      Exam.deleteMany({}),
      Notification.deleteMany({}),
      Library.deleteMany({}),
      Certificate.deleteMany({}),
      ParentLink.deleteMany({}),
      ShorthandDictation.deleteMany({}),
      ShorthandAttempt.deleteMany({}),
      PracticeSession.deleteMany({}),
      ExamAttempt.deleteMany({}),
      Payment.deleteMany({}),
      DeviceToken.deleteMany({}),
    ]);

    await User.create({
      name: "Admin",
      email: "admin@luvkush.com",
      password: "admin123",
      role: "admin",
      phone: "9876543210",
    });

    const teacher = await User.create({
      name: "Rajesh Kumar",
      email: "teacher@luvkush.com",
      password: "teacher123",
      role: "teacher",
      phone: "9876543211",
    });

    const teacherProfile = await TeacherProfile.create({
      user: teacher._id,
      qualification: "M.A. Shorthand",
      experience: "10 years",
      salary: 35000,
      subjects: ["Shorthand", "Typing"],
      rating: 4.8,
    });

    const student = await User.create({
      name: "Priya Sharma",
      email: "student@luvkush.com",
      password: "student123",
      role: "student",
      phone: "9876543212",
    });

    const student2 = await User.create({
      name: "Amit Verma",
      email: "amit@luvkush.com",
      password: "student123",
      role: "student",
      phone: "9876543213",
    });

    const parent = await User.create({
      name: "Ramesh Sharma",
      email: "parent@luvkush.com",
      password: "parent123",
      role: "parent",
      phone: "9876543299",
    });

    const createdCourses = await Course.insertMany(courses);

    const morningBatch = await Batch.create({
      name: "Morning Batch A",
      type: "morning",
      timing: "7:00 AM - 9:00 AM",
      strength: 30,
      course: createdCourses[0]._id,
      teacher: teacher._id,
      students: [student._id, student2._id],
    });

    const eveningBatch = await Batch.create({
      name: "Evening Batch B",
      type: "evening",
      timing: "5:00 PM - 7:00 PM",
      strength: 25,
      course: createdCourses[4]._id,
      teacher: teacher._id,
      students: [],
    });

    await ParentLink.create({
      parent: parent._id,
      student: student._id,
      relationship: "father",
    });

    await StudentProfile.create({
      user: student._id,
      course: createdCourses[0]._id,
      batch: morningBatch._id,
      teacher: teacher._id,
      feesStatus: "partial",
      totalFees: 8000,
      paidFees: 4000,
      performanceScore: 65,
      attendancePercent: 85,
      parentName: "Ramesh Sharma",
      parentPhone: "9876543299",
      streak: 5,
      badges: ["5-day-streak"],
      xp: 350,
      level: 2,
      lastPracticeDate: new Date(),
      practiceHistory: [
        { date: new Date(), wpm: 72, accuracy: 88, type: "shorthand" },
        { date: new Date(Date.now() - 86400000), wpm: 68, accuracy: 85, type: "typing" },
      ],
    });

    await StudentProfile.create({
      user: student2._id,
      course: createdCourses[4]._id,
      batch: morningBatch._id,
      teacher: teacher._id,
      feesStatus: "pending",
      totalFees: 5000,
      paidFees: 0,
      performanceScore: 45,
      attendancePercent: 70,
      xp: 120,
      level: 1,
    });

    teacherProfile.batches = [morningBatch._id, eveningBatch._id];
    await teacherProfile.save();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Attendance.create({
      student: student._id,
      batch: morningBatch._id,
      date: today,
      status: "present",
      method: "manual",
      markedBy: teacher._id,
    });

    await Fee.create({
      student: student._id,
      amount: 4000,
      paidAmount: 4000,
      dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      status: "paid",
      paymentMethod: "upi",
      receiptNumber: "RCP-001",
    });

    await Fee.create({
      student: student._id,
      amount: 4000,
      paidAmount: 0,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: "pending",
    });

    await Exam.create({
      title: "Weekly Typing Test",
      type: "weekly",
      questionType: "typing",
      course: createdCourses[4]._id,
      batch: morningBatch._id,
      createdBy: teacher._id,
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      duration: 30,
      totalMarks: 100,
      isPublished: true,
      questions: [
        {
          question: "Type the following passage accurately",
          correctAnswer: "The quick brown fox jumps over the lazy dog near the river bank every morning",
          marks: 100,
          targetWpm: 40,
        },
      ],
    });

    await Exam.create({
      title: "Shorthand Mock Test - 80 WPM",
      type: "mock",
      questionType: "shorthand",
      course: createdCourses[0]._id,
      batch: morningBatch._id,
      createdBy: teacher._id,
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      duration: 60,
      totalMarks: 100,
      isPublished: true,
      questions: [
        {
          question: "Dictation at 80 WPM",
          correctAnswer: "Government initiatives aim to improve digital literacy among youth across the nation",
          targetWpm: 80,
          marks: 100,
        },
      ],
    });

    await Exam.create({
      title: "MCQ Fundamentals Quiz",
      type: "weekly",
      questionType: "mcq",
      course: createdCourses[0]._id,
      batch: morningBatch._id,
      createdBy: teacher._id,
      scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      duration: 20,
      totalMarks: 10,
      isPublished: true,
      questions: [
        {
          question: "What does WPM stand for?",
          options: ["Words Per Minute", "Writing Per Month", "Words Per Message", "Work Per Minute"],
          correctAnswer: "Words Per Minute",
          marks: 2,
        },
        {
          question: "Which skill is essential for stenography?",
          options: ["Drawing", "Listening", "Singing", "Cooking"],
          correctAnswer: "Listening",
          marks: 2,
        },
      ],
    });

    await ShorthandDictation.create({
      title: "Morning Dictation - 80 WPM",
      audioUrl: "https://res.cloudinary.com/demo/audio/upload/sample.mp3",
      transcript:
        "The chairman announced that the quarterly results exceeded expectations due to strong performance in all departments",
      targetWpm: 80,
      durationSeconds: 120,
      batch: morningBatch._id,
      course: createdCourses[0]._id,
      uploadedBy: teacher._id,
      isActive: true,
    });

    await ShorthandDictation.create({
      title: "Practice Dictation - 100 WPM",
      audioUrl: "https://res.cloudinary.com/demo/audio/upload/sample2.mp3",
      transcript:
        "Students must practice daily to improve shorthand speed and maintain accuracy during competitive examinations",
      targetWpm: 100,
      durationSeconds: 90,
      batch: morningBatch._id,
      course: createdCourses[1]._id,
      uploadedBy: teacher._id,
      isActive: true,
    });

    await PracticeSession.insertMany([
      { student: student._id, type: "typing", wpm: 45, accuracy: 92, xpEarned: 25, practicedAt: new Date() },
      { student: student._id, type: "shorthand", wpm: 72, accuracy: 88, xpEarned: 30, practicedAt: new Date(Date.now() - 86400000) },
      { student: student2._id, type: "typing", wpm: 35, accuracy: 85, xpEarned: 18, practicedAt: new Date() },
    ]);

    await Notification.insertMany([
      { recipient: student._id, title: "Fee Reminder", message: "₹4,000 fee due in 15 days", type: "fee" },
      { recipient: student._id, title: "Upcoming Exam", message: "Weekly Typing Test in 3 days", type: "exam" },
      { recipient: teacher._id, title: "Batch Update", message: "Morning Batch A has 2 students", type: "info" },
      { recipient: student._id, title: "Streak Achievement", message: "You've maintained a 5-day practice streak!", type: "achievement" },
      { recipient: parent._id, title: "Welcome", message: "You are now linked to Priya Sharma's account", type: "info" },
    ]);

    console.log("Database seeded successfully.");
    console.log("Default accounts:");
    console.log("  Admin:   admin@luvkush.com / admin123");
    console.log("  Teacher: teacher@luvkush.com / teacher123");
    console.log("  Student: student@luvkush.com / student123");
    console.log("  Parent:  parent@luvkush.com / parent123");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
};

seed();