import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AdminUser,
  TestCategory,
  TestSeries,
  TestSeriesItem,
  Chapter,
  Question,
  TestQuestion,
  NoteCategory,
  Note,
  BlogCategory,
  Blog,
  BookCategory,
  Book,
  BookLink,
  SeriesEnrollment,
} from '../types/database';

interface MockDataContextType {
  adminUsers: AdminUser[];
  setAdminUsers: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  testCategories: TestCategory[];
  setTestCategories: React.Dispatch<React.SetStateAction<TestCategory[]>>;
  testSeries: TestSeries[];
  setTestSeries: React.Dispatch<React.SetStateAction<TestSeries[]>>;
  testSeriesItems: TestSeriesItem[];
  setTestSeriesItems: React.Dispatch<React.SetStateAction<TestSeriesItem[]>>;
  chapters: Chapter[];
  setChapters: React.Dispatch<React.SetStateAction<Chapter[]>>;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  testQuestions: TestQuestion[];
  setTestQuestions: React.Dispatch<React.SetStateAction<TestQuestion[]>>;
  noteCategories: NoteCategory[];
  setNoteCategories: React.Dispatch<React.SetStateAction<NoteCategory[]>>;
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  blogCategories: BlogCategory[];
  setBlogCategories: React.Dispatch<React.SetStateAction<BlogCategory[]>>;
  blogs: Blog[];
  setBlogs: React.Dispatch<React.SetStateAction<Blog[]>>;
  bookCategories: BookCategory[];
  setBookCategories: React.Dispatch<React.SetStateAction<BookCategory[]>>;
  books: Book[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
  bookLinks: BookLink[];
  setBookLinks: React.Dispatch<React.SetStateAction<BookLink[]>>;
  enrollments: SeriesEnrollment[];
  setEnrollments: React.Dispatch<React.SetStateAction<SeriesEnrollment[]>>;
  resetToDefaults: () => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

// Initial Rich Mock Seed Data
const INITIAL_ADMINS: AdminUser[] = [
  {
    id: 'adm-1',
    user_id: 'usr-admin-1',
    name: 'Gaurav Jha',
    email: 'admin@cccprep.com',
    role: 'super_admin',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'adm-2',
    user_id: 'usr-admin-2',
    name: 'Priya Sharma',
    email: 'editor@cccprep.com',
    role: 'editor',
    is_active: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

const INITIAL_TEST_CATEGORIES: TestCategory[] = [
  { id: 'tcat-1', title: 'CCC Full Mock Tests', is_active: true, sort_order: 1, created_at: new Date().toISOString() },
  { id: 'tcat-2', title: 'Chapter-wise Practice', is_active: true, sort_order: 2, created_at: new Date().toISOString() },
  { id: 'tcat-3', title: 'Previous Year Papers', is_active: true, sort_order: 3, created_at: new Date().toISOString() },
  { id: 'tcat-4', title: 'Speed & Accuracy Tests', is_active: true, sort_order: 4, created_at: new Date().toISOString() },
];

const INITIAL_TEST_SERIES: TestSeries[] = [
  {
    id: 'tser-1',
    category_id: 'tcat-1',
    title: 'CCC 2026 Ultimate Test Series',
    description: '10 Full-length mock tests based on latest NIELIT CCC exam syllabus with detailed bilingual solutions.',
    is_featured: true,
    featured_tag: 'MOST POPULAR',
    featured_short_desc: 'Complete 1000+ question exam simulation with timer.',
    total_sets_available: 10,
    total_enrolled: 1420,
    is_paid: false,
    price: 0,
    currency: 'INR',
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    last_updated_at: new Date().toISOString(),
  },
  {
    id: 'tser-2',
    category_id: 'tcat-2',
    title: 'LibreOffice & OS Mastery Series',
    description: 'Focused test sets covering LibreOffice Writer, Calc, Impress and Operating System fundamentals.',
    is_featured: true,
    featured_tag: 'TOP RATED',
    featured_short_desc: 'Master the high-weightage LibreOffice modules.',
    total_sets_available: 6,
    total_enrolled: 890,
    is_paid: false,
    price: 0,
    currency: 'INR',
    is_active: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    last_updated_at: new Date().toISOString(),
  },
  {
    id: 'tser-3',
    category_id: 'tcat-3',
    title: 'CCC 2024-2025 Solved Papers',
    description: 'Original previous cycle NIELIT exam questions with verified answer keys.',
    is_featured: false,
    total_sets_available: 5,
    total_enrolled: 620,
    is_paid: false,
    price: 0,
    currency: 'INR',
    is_active: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    last_updated_at: new Date().toISOString(),
  },
];

const INITIAL_TEST_ITEMS: TestSeriesItem[] = [
  {
    id: 'item-1',
    series_id: 'tser-1',
    title: 'CCC Full Mock Test 01',
    test_type: 'Mock',
    question_count: 100,
    duration: 90,
    difficulty: 'Medium',
    total_marks: 100,
    negative_marking_enabled: false,
    negative_marks: 0,
    sort_order: 0,
    is_published: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'item-2',
    series_id: 'tser-1',
    title: 'CCC Full Mock Test 02',
    test_type: 'Mock',
    question_count: 100,
    duration: 90,
    difficulty: 'Hard',
    total_marks: 100,
    negative_marking_enabled: false,
    negative_marks: 0,
    sort_order: 1,
    is_published: true,
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'item-3',
    series_id: 'tser-2',
    title: 'LibreOffice Calc Formulas & Charts',
    test_type: 'Topic',
    question_count: 50,
    duration: 45,
    difficulty: 'Medium',
    total_marks: 50,
    negative_marking_enabled: false,
    negative_marks: 0,
    sort_order: 0,
    is_published: true,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
];

const INITIAL_CHAPTERS: Chapter[] = [
  { id: 'ch-1', title: 'Introduction to Computer & GUI Based Operating System', hindi_title: 'कंप्यूटर का परिचय और ऑपरेटिंग सिस्टम', description: 'Hardware, software, file management, desktop concepts.', is_active: true, sort_order: 1, created_at: new Date().toISOString() },
  { id: 'ch-2', title: 'Elements of Word Processing (LibreOffice Writer)', hindi_title: 'वर्ड प्रोसेसिंग (लिबरेऑफिस राइटर)', description: 'Text formatting, mail merge, tables, spell check.', is_active: true, sort_order: 2, created_at: new Date().toISOString() },
  { id: 'ch-3', title: 'Spreadsheet (LibreOffice Calc)', hindi_title: 'स्प्रेडशीट (लिबरेऑफिस कैल्क)', description: 'Formulas, functions, charts, filtering, cell referencing.', is_active: true, sort_order: 3, created_at: new Date().toISOString() },
  { id: 'ch-4', title: 'Presentation (LibreOffice Impress)', hindi_title: 'प्रेजेंटेशन (लिबरेऑफिस इम्प्रेस)', description: 'Slide transition, animation, templates, slide master.', is_active: true, sort_order: 4, created_at: new Date().toISOString() },
  { id: 'ch-5', title: 'Introduction to Internet & WWW', hindi_title: 'इंटरनेट और डब्ल्यूडब्ल्यूडब्ल्यू का परिचय', description: 'LAN, WAN, IP address, web browsers, search engines.', is_active: true, sort_order: 5, created_at: new Date().toISOString() },
  { id: 'ch-6', title: 'E-mail, Social Networking and e-Governance', hindi_title: 'ई-मेल, सोशल नेटवर्किंग और ई-गवर्नेंस', description: 'Email protocols, DigiLocker, UMANG app, Aadhaar services.', is_active: true, sort_order: 6, created_at: new Date().toISOString() },
  { id: 'ch-7', title: 'Digital Financial Tools and Applications', hindi_title: 'डिजिटल वित्तीय उपकरण और अनुप्रयोग', description: 'UPI, AEPS, USSD, NEFT, RTGS, IMPS, cards, wallets.', is_active: true, sort_order: 7, created_at: new Date().toISOString() },
  { id: 'ch-8', title: 'Overview of Cyber Security & Future Skills', hindi_title: 'साइबर सुरक्षा और भविष्य के कौशल', description: 'Malware, phishing, firewall, IoT, AI, Cloud computing.', is_active: true, sort_order: 8, created_at: new Date().toISOString() },
];

const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q-1',
    chapter_id: 'ch-2',
    question_en: 'What is the default file extension of a document saved in LibreOffice Writer?',
    question_hi: 'लिबरेऑफिस राइटर में सेव किए गए डॉक्यूमेंट का डिफॉल्ट फाइल एक्सटेंशन क्या होता है?',
    option_a_en: '.odt',
    option_a_hi: '.odt',
    option_b_en: '.docx',
    option_b_hi: '.docx',
    option_c_en: '.txt',
    option_c_hi: '.txt',
    option_d_en: '.odp',
    option_d_hi: '.odp',
    correct_option: 'A',
    explanation_en: 'LibreOffice Writer saves documents by default in OpenDocument Text format (.odt).',
    explanation_hi: 'लिबरेऑफिस राइटर डिफॉल्ट रूप से ओपनडॉक्यूमेंट टेक्स्ट फॉर्मेट (.odt) में फाइलों को सेव करता है।',
    difficulty: 'Easy',
    question_type: 'MCQ',
    source: 'NIELIT 2025',
    is_active: true,
    created_at: new Date().toISOString(),
    test_ids: ['item-1'],
  },
  {
    id: 'q-2',
    chapter_id: 'ch-3',
    question_en: 'Which shortcut key is used to insert a new function/formula wizard in LibreOffice Calc?',
    question_hi: 'लिबरेऑफिस कैल्क में नया फंक्शन/फॉर्मूला विजार्ड इंसर्ट करने के लिए किस शॉर्टकट कुंजी का उपयोग किया जाता है?',
    option_a_en: 'Ctrl + F2',
    option_a_hi: 'Ctrl + F2',
    option_b_en: 'Ctrl + Shift + F',
    option_b_hi: 'Ctrl + Shift + F',
    option_c_en: 'Alt + F2',
    option_c_hi: 'Alt + F2',
    option_d_en: 'F3',
    option_d_hi: 'F3',
    correct_option: 'A',
    explanation_en: 'Ctrl + F2 opens the Function Wizard in LibreOffice Calc.',
    explanation_hi: 'Ctrl + F2 लिबरेऑफिस कैल्क में फंक्शन विजार्ड खोलता है।',
    difficulty: 'Medium',
    question_type: 'MCQ',
    source: 'NIELIT 2024',
    is_active: true,
    created_at: new Date().toISOString(),
    test_ids: ['item-1', 'item-3'],
  },
  {
    id: 'q-3',
    chapter_id: 'ch-7',
    question_en: 'What is the full form of AEPS in digital financial services?',
    question_hi: 'डिजिटल वित्तीय सेवाओं में AEPS का पूर्ण रूप क्या है?',
    option_a_en: 'Aadhaar Enabled Payment System',
    option_a_hi: 'आधार इनेबल्ड पेमेंट सिस्टम',
    option_b_en: 'Automatic Electronic Payment Service',
    option_b_hi: 'ऑटोमेटिक इलेक्ट्रॉनिक पेमेंट सर्विस',
    option_c_en: 'Aadhaar Electronic Postal System',
    option_c_hi: 'आधार इलेक्ट्रॉनिक पोस्टल सिस्टम',
    option_d_en: 'Advanced Easy Payment Solution',
    option_d_hi: 'एडवांस्ड ईज़ी पेमेंट सॉल्यूशन',
    correct_option: 'A',
    explanation_en: 'AEPS stands for Aadhaar Enabled Payment System developed by NPCI.',
    explanation_hi: 'AEPS का अर्थ नेशनल पेमेंट्स कॉर्पोरेशन ऑफ इंडिया (NPCI) द्वारा विकसित आधार इनेबल्ड पेमेंट सिस्टम है।',
    difficulty: 'Easy',
    question_type: 'MCQ',
    source: 'CCC Study Material',
    is_active: true,
    created_at: new Date().toISOString(),
    test_ids: ['item-1', 'item-2'],
  },
  {
    id: 'q-4',
    chapter_id: 'ch-8',
    question_en: 'Phishing is a fraudulent attempt to obtain sensitive information like usernames and passwords.',
    question_hi: 'फ़िशिंग संवेदनशील जानकारी जैसे उपयोगकर्ता नाम और पासवर्ड प्राप्त करने का एक धोखाधड़ी वाला प्रयास है।',
    option_a_en: 'True',
    option_a_hi: 'सही (True)',
    option_b_en: 'False',
    option_b_hi: 'गलत (False)',
    option_c_en: 'Cannot Say',
    option_c_hi: 'कहा नहीं जा सकता',
    option_d_en: 'None',
    option_d_hi: 'कोई नहीं',
    correct_option: 'A',
    explanation_en: 'Phishing emails and links disguise themselves as trustworthy entities to steal private data.',
    explanation_hi: 'फ़िशिंग ईमेल और लिंक निजी डेटा चुराने के लिए भरोसेमंद संस्थाओं के रूप में प्रतिरूपित होते हैं।',
    difficulty: 'Easy',
    question_type: 'True/False',
    source: 'Cyber Security Module',
    is_active: true,
    created_at: new Date().toISOString(),
    test_ids: ['item-2'],
  },
  {
    id: 'q-5',
    chapter_id: 'ch-5',
    question_en: 'IPv6 address consists of how many bits?',
    question_hi: 'IPv6 एड्रेस कितने बिट्स का होता है?',
    option_a_en: '32 bits',
    option_a_hi: '32 बिट्स',
    option_b_en: '64 bits',
    option_b_hi: '64 बिट्स',
    option_c_en: '128 bits',
    option_c_hi: '128 बिट्स',
    option_d_en: '256 bits',
    option_d_hi: '256 बिट्स',
    correct_option: 'C',
    explanation_en: 'IPv4 uses 32-bit addresses, whereas IPv6 uses 128-bit hexadecimal addresses.',
    explanation_hi: 'IPv4 32-बिट पते का उपयोग करता है, जबकि IPv6 128-बिट हेक्साडेसिमल पते का उपयोग करता है।',
    difficulty: 'Medium',
    question_type: 'MCQ',
    source: 'NIELIT Question Bank',
    is_active: true,
    created_at: new Date().toISOString(),
    test_ids: ['item-1'],
  },
];

const INITIAL_TEST_QUESTIONS: TestQuestion[] = [
  { id: 'tq-1', test_series_item_id: 'item-1', question_id: 'q-1', question_order: 1, created_at: new Date().toISOString() },
  { id: 'tq-2', test_series_item_id: 'item-1', question_id: 'q-2', question_order: 2, created_at: new Date().toISOString() },
  { id: 'tq-3', test_series_item_id: 'item-1', question_id: 'q-3', question_order: 3, created_at: new Date().toISOString() },
  { id: 'tq-4', test_series_item_id: 'item-1', question_id: 'q-4', question_order: 4, created_at: new Date().toISOString() },
  { id: 'tq-5', test_series_item_id: 'item-1', question_id: 'q-5', question_order: 5, created_at: new Date().toISOString() },
];

const INITIAL_NOTE_CATEGORIES: NoteCategory[] = [
  { id: 'ncat-1', title: 'Chapter Handouts', hindi_title: 'अध्याय हैंडआउट्स', is_active: true, sort_order: 1, created_at: new Date().toISOString() },
  { id: 'ncat-2', title: 'Shortcuts & Cheat Sheets', hindi_title: 'शॉर्टकट और चीट शीट्स', is_active: true, sort_order: 2, created_at: new Date().toISOString() },
  { id: 'ncat-3', title: 'Full Syllabus Revision Books', hindi_title: 'सम्पूर्ण पाठ्यक्रम रिवीजन बुक्स', is_active: true, sort_order: 3, created_at: new Date().toISOString() },
];

const INITIAL_NOTES: Note[] = [
  {
    id: 'note-1',
    category_id: 'ncat-2',
    title: 'LibreOffice Complete Keyboard Shortcuts Sheet',
    hindi_title: 'लिबरेऑफिस सम्पूर्ण कीबोर्ड शॉर्टकट्स गाइड',
    description: 'Comprehensive cheat sheet containing all essential shortcut keys for Writer, Calc, and Impress.',
    hindi_description: 'राइटर, कैल्क और इम्प्रेस के लिए सभी आवश्यक शॉर्टकट कुंजियों से युक्त सम्पूर्ण चीट शीट।',
    pdf_url: 'https://example.com/notes/libreoffice-shortcuts.pdf',
    thumbnail_url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=300&q=80',
    file_name: 'libreoffice-shortcuts-2026.pdf',
    file_size: 2450000,
    page_count: 14,
    is_featured: true,
    is_active: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'note-2',
    category_id: 'ncat-1',
    title: 'Digital Financial Tools & Cyber Security Notes',
    hindi_title: 'डिजिटल वित्तीय उपकरण और साइबर सुरक्षा नोट्स',
    description: 'In-depth notes on UPI, AEPS, RTGS, NEFT, IMPS, POS, Malware, and Firewalls.',
    hindi_description: 'यूपीआई, एईपीएस, आरटीजीएस, एनईएफटी, आईएमपीएस, मैलवेयर और फायरवॉल पर विस्तृत नोट्स।',
    pdf_url: 'https://example.com/notes/digital-financial-tools.pdf',
    thumbnail_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=300&q=80',
    file_name: 'digital-financial-tools-notes.pdf',
    file_size: 4890000,
    page_count: 28,
    is_featured: true,
    is_active: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const INITIAL_BLOG_CATEGORIES: BlogCategory[] = [
  { id: 'bcat-1', title: 'Exam Strategy & Tips', hindi_title: 'परीक्षा रणनीति और टिप्स', is_active: true, sort_order: 1, created_at: new Date().toISOString() },
  { id: 'bcat-2', title: 'Syllabus & Updates', hindi_title: 'पाठ्यक्रम और नवीनतम अपडेट', is_active: true, sort_order: 2, created_at: new Date().toISOString() },
  { id: 'bcat-3', title: 'Computer Fundamentals', hindi_title: 'कंप्यूटर मूलभूत बातें', is_active: true, sort_order: 3, created_at: new Date().toISOString() },
];

const INITIAL_BLOGS: Blog[] = [
  {
    id: 'blog-1',
    category_id: 'bcat-1',
    title_en: 'How to Score Grade S in NIELIT CCC Exam on Your First Attempt',
    title_hi: 'अपने पहले प्रयास में NIELIT CCC परीक्षा में ग्रेड S कैसे प्राप्त करें',
    slug: 'how-to-score-grade-s-in-nielit-ccc-exam',
    summary_en: 'Proven 15-day preparation roadmap focusing on LibreOffice formulas, digital tools, and speed mock tests.',
    summary_hi: 'लिबरेऑफिस सूत्रों, डिजिटल उपकरणों और स्पीड मॉक टेस्ट पर केंद्रित 15-दिवसीय तैयारी रणनीति।',
    content_en: '## Introduction\n\nThe NIELIT CCC (Course on Computer Concepts) exam consists of 100 objective questions (MCQs & True/False) to be completed in 90 minutes. With no negative marking, achieving an **S Grade** (85%+ marks) requires strategic focus on high-weightage chapters like LibreOffice and Digital Financial Tools.\n\n### 1. Master LibreOffice Keyboard Shortcuts\nOver 30% of the exam covers Writer, Calc, and Impress functions.\n\n### 2. Practice Daily Mock Tests\nSimulate real exam conditions with timed quizzes.\n\n### 3. Review Cyber Security & Future Skills\nUnderstand IoT, Cloud Computing, and basic cyber security hygiene.',
    content_hi: '## परिचय\n\nNIELIT CCC परीक्षा में 90 मिनट में 100 वस्तुनिष्ठ प्रश्न हल करने होते हैं। नकारात्मक अंकन (Negative Marking) न होने के कारण **ग्रेड S** प्राप्त करना आसान है बशर्ते आप महत्वपूर्ण विषयों पर ध्यान दें।',
    featured_image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
    author: 'Admin Team',
    is_featured: true,
    is_published: true,
    published_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
  {
    id: 'blog-2',
    category_id: 'bcat-2',
    title_en: 'NIELIT CCC 2026 Latest Syllabus & Marking Scheme Explained',
    title_hi: 'NIELIT CCC 2026 नवीनतम पाठ्यक्रम और अंकन योजना की व्याख्या',
    slug: 'nielit-ccc-2026-latest-syllabus-marking-scheme',
    summary_en: 'Complete breakdown of all 8 chapters, minimum passing criteria, and grade calculation table.',
    summary_hi: 'सभी 8 अध्यायों का विस्तृत विवरण, न्यूनतम उत्तीर्ण अंक और ग्रेड गणना तालिका।',
    content_en: '## Exam Pattern\n- Total Questions: 100\n- Total Marks: 100\n- Duration: 90 Minutes\n- Qualifying Marks: 50%\n\n### Grade Structure\n- **S**: 85% and above\n- **A**: 75% to 84%\n- **B**: 65% to 74%\n- **C**: 55% to 64%\n- **D**: 50% to 54%',
    content_hi: '## परीक्षा पैटर्न\n- कुल प्रश्न: 100\n- कुल अंक: 100\n- समय: 90 मिनट',
    featured_image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80',
    author: 'Gaurav Jha',
    is_featured: false,
    is_published: true,
    published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

const INITIAL_BOOK_CATEGORIES: BookCategory[] = [
  { id: 'bkcat-1', title: 'Complete Guidebooks', hindi_title: 'सम्पूर्ण गाइड बुक्स', is_active: true, sort_order: 1, created_at: new Date().toISOString() },
  { id: 'bkcat-2', title: 'Chapterwise Question Banks', hindi_title: 'अध्यायवार प्रश्न बैंक', is_active: true, sort_order: 2, created_at: new Date().toISOString() },
  { id: 'bkcat-3', title: 'Solved Papers & Practice Sets', hindi_title: 'सॉल्व्ड पेपर्स और प्रैक्टिस सेट्स', is_active: true, sort_order: 3, created_at: new Date().toISOString() },
];

const INITIAL_BOOKS: Book[] = [
  {
    id: 'book-1',
    category_id: 'bkcat-1',
    title: 'CCC Exam Master Guide 2026 (Bilingual Edition)',
    hindi_title: 'CCC एग्जाम मास्टर गाइड 2026 (द्विभाषी संस्करण)',
    author: 'Arihant Experts',
    description: 'Thorough coverage of all NIELIT revised syllabus chapters with 3000+ chapter-wise MCQs and 5 full practice sets.',
    hindi_description: '3000+ वस्तुनिष्ठ प्रश्नों और 5 अभ्यास सेटों के साथ नवीनतम पाठ्यक्रम पर आधारित सम्पूर्ण गाइड।',
    cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
    language: 'Bilingual (Hindi / English)',
    pages: 420,
    edition: '2026 Edition',
    publisher: 'Arihant Publications',
    isbn: '978-9359981234',
    is_featured: true,
    is_active: true,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'book-2',
    category_id: 'bkcat-3',
    title: 'CCC 25 Solved Papers & 15 Practice Workbooks',
    hindi_title: 'CCC 25 सॉल्व्ड पेपर्स और 15 प्रैक्टिस वर्कबुक्स',
    author: 'Youth Competition Times',
    description: 'Contains authentic past examination questions categorized year-wise with detailed Hindi explanations.',
    hindi_description: 'विस्तृत हिंदी व्याख्या के साथ पिछले वर्षों के प्रश्नों का प्रामाणिक संग्रह।',
    cover_image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
    language: 'Hindi',
    pages: 310,
    edition: '12th Revised Edition',
    publisher: 'YCT Publications',
    isbn: '978-8194451299',
    is_featured: true,
    is_active: true,
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
];

const INITIAL_BOOK_LINKS: BookLink[] = [
  {
    id: 'bl-1',
    book_id: 'book-1',
    platform: 'Amazon',
    affiliate_url: 'https://www.amazon.in/dp/9359981234?tag=cccprep-21',
    price: 265,
    currency: 'INR',
    is_available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'bl-2',
    book_id: 'book-1',
    platform: 'Flipkart',
    affiliate_url: 'https://www.flipkart.com/ccc-exam-master-guide-2026/p/itm12345?affid=cccprep',
    price: 249,
    currency: 'INR',
    is_available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'bl-3',
    book_id: 'book-2',
    platform: 'Amazon',
    affiliate_url: 'https://www.amazon.in/dp/8194451299?tag=cccprep-21',
    price: 195,
    currency: 'INR',
    is_available: true,
    created_at: new Date().toISOString(),
  },
];

const INITIAL_ENROLLMENTS: SeriesEnrollment[] = [
  {
    id: 'enr-1',
    user_id: 'usr-101',
    user_name: 'Rahul Kumar Verma',
    user_email: 'rahul.verma@example.com',
    series_id: 'tser-1',
    access_type: 'free',
    status: 'active',
    enrolled_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'enr-2',
    user_id: 'usr-102',
    user_name: 'Anjali Srivastava',
    user_email: 'anjali.s@example.com',
    series_id: 'tser-1',
    access_type: 'free',
    status: 'active',
    enrolled_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'enr-3',
    user_id: 'usr-103',
    user_name: 'Vikas Tiwari',
    user_email: 'vikas.t@example.com',
    series_id: 'tser-2',
    access_type: 'promotional',
    status: 'active',
    enrolled_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'enr-4',
    user_id: 'usr-104',
    user_name: 'Neha Gupta',
    user_email: 'neha.gupta@example.com',
    series_id: 'tser-3',
    access_type: 'free',
    status: 'expired',
    enrolled_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    expires_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

export const MockDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loadStored = <T,>(key: string, defaultVal: T): T => {
    try {
      const stored = localStorage.getItem(`ccc_admin_${key}`);
      return stored ? JSON.parse(stored) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => loadStored('admin_users', INITIAL_ADMINS));
  const [testCategories, setTestCategories] = useState<TestCategory[]>(() => loadStored('test_categories', INITIAL_TEST_CATEGORIES));
  const [testSeries, setTestSeries] = useState<TestSeries[]>(() => loadStored('test_series', INITIAL_TEST_SERIES));
  const [testSeriesItems, setTestSeriesItems] = useState<TestSeriesItem[]>(() => loadStored('test_series_items', INITIAL_TEST_ITEMS));
  const [chapters, setChapters] = useState<Chapter[]>(() => loadStored('chapters', INITIAL_CHAPTERS));
  const [questions, setQuestions] = useState<Question[]>(() => loadStored('questions', INITIAL_QUESTIONS));
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>(() => loadStored('test_questions', INITIAL_TEST_QUESTIONS));
  const [noteCategories, setNoteCategories] = useState<NoteCategory[]>(() => loadStored('note_categories', INITIAL_NOTE_CATEGORIES));
  const [notes, setNotes] = useState<Note[]>(() => loadStored('notes', INITIAL_NOTES));
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>(() => loadStored('blog_categories', INITIAL_BLOG_CATEGORIES));
  const [blogs, setBlogs] = useState<Blog[]>(() => loadStored('blogs', INITIAL_BLOGS));
  const [bookCategories, setBookCategories] = useState<BookCategory[]>(() => loadStored('book_categories', INITIAL_BOOK_CATEGORIES));
  const [books, setBooks] = useState<Book[]>(() => loadStored('books', INITIAL_BOOKS));
  const [bookLinks, setBookLinks] = useState<BookLink[]>(() => loadStored('book_links', INITIAL_BOOK_LINKS));
  const [enrollments, setEnrollments] = useState<SeriesEnrollment[]>(() => loadStored('enrollments', INITIAL_ENROLLMENTS));

  // Sync to local storage
  useEffect(() => { localStorage.setItem('ccc_admin_admin_users', JSON.stringify(adminUsers)); }, [adminUsers]);
  useEffect(() => { localStorage.setItem('ccc_admin_test_categories', JSON.stringify(testCategories)); }, [testCategories]);
  useEffect(() => { localStorage.setItem('ccc_admin_test_series', JSON.stringify(testSeries)); }, [testSeries]);
  useEffect(() => { localStorage.setItem('ccc_admin_test_series_items', JSON.stringify(testSeriesItems)); }, [testSeriesItems]);
  useEffect(() => { localStorage.setItem('ccc_admin_chapters', JSON.stringify(chapters)); }, [chapters]);
  useEffect(() => { localStorage.setItem('ccc_admin_questions', JSON.stringify(questions)); }, [questions]);
  useEffect(() => { localStorage.setItem('ccc_admin_test_questions', JSON.stringify(testQuestions)); }, [testQuestions]);
  useEffect(() => { localStorage.setItem('ccc_admin_note_categories', JSON.stringify(noteCategories)); }, [noteCategories]);
  useEffect(() => { localStorage.setItem('ccc_admin_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('ccc_admin_blog_categories', JSON.stringify(blogCategories)); }, [blogCategories]);
  useEffect(() => { localStorage.setItem('ccc_admin_blogs', JSON.stringify(blogs)); }, [blogs]);
  useEffect(() => { localStorage.setItem('ccc_admin_book_categories', JSON.stringify(bookCategories)); }, [bookCategories]);
  useEffect(() => { localStorage.setItem('ccc_admin_books', JSON.stringify(books)); }, [books]);
  useEffect(() => { localStorage.setItem('ccc_admin_book_links', JSON.stringify(bookLinks)); }, [bookLinks]);
  useEffect(() => { localStorage.setItem('ccc_admin_enrollments', JSON.stringify(enrollments)); }, [enrollments]);

  const resetToDefaults = () => {
    setAdminUsers(INITIAL_ADMINS);
    setTestCategories(INITIAL_TEST_CATEGORIES);
    setTestSeries(INITIAL_TEST_SERIES);
    setTestSeriesItems(INITIAL_TEST_ITEMS);
    setChapters(INITIAL_CHAPTERS);
    setQuestions(INITIAL_QUESTIONS);
    setTestQuestions(INITIAL_TEST_QUESTIONS);
    setNoteCategories(INITIAL_NOTE_CATEGORIES);
    setNotes(INITIAL_NOTES);
    setBlogCategories(INITIAL_BLOG_CATEGORIES);
    setBlogs(INITIAL_BLOGS);
    setBookCategories(INITIAL_BOOK_CATEGORIES);
    setBooks(INITIAL_BOOKS);
    setBookLinks(INITIAL_BOOK_LINKS);
    setEnrollments(INITIAL_ENROLLMENTS);
  };

  return (
    <MockDataContext.Provider
      value={{
        adminUsers,
        setAdminUsers,
        testCategories,
        setTestCategories,
        testSeries,
        setTestSeries,
        testSeriesItems,
        setTestSeriesItems,
        chapters,
        setChapters,
        questions,
        setQuestions,
        testQuestions,
        setTestQuestions,
        noteCategories,
        setNoteCategories,
        notes,
        setNotes,
        blogCategories,
        setBlogCategories,
        blogs,
        setBlogs,
        bookCategories,
        setBookCategories,
        books,
        setBooks,
        bookLinks,
        setBookLinks,
        enrollments,
        setEnrollments,
        resetToDefaults,
      }}
    >
      {children}
    </MockDataContext.Provider>
  );
};

export const useMockData = () => {
  const context = useContext(MockDataContext);
  if (!context) {
    throw new Error('useMockData must be used within a MockDataProvider');
  }
  return context;
};
