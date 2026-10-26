import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faLightbulb,
    faCompass,
    faShieldAlt,
    faCogs,
    faChartLine,
    faCheckCircle,
    faQuestionCircle,
    faUsers,
    faLock,
    faSyncAlt,
    faRobot,
    faFileAlt
} from "@fortawesome/free-solid-svg-icons";

export default function SakVerseDocumentation() {
    return (
        <div className="h-screen w-full overflow-hidden flex font-sans text-gray-800 bg-gradient-to-b from-gray-50 to-gray-100">

             {/* <nav className="sticky hidden md:block w-64 min-w-[200px] bg-white border-r border-gray-200 px-4 py-10 sticky top-0 h-screen overflow-y-auto">
                <h2 className="text-xl font-bold text-indigo-700 mb-6">Documentation</h2>
                <ul className="space-y-3 text-indigo-600 text-sm font-medium">
                    <li><a href="#what-is-sakverse" className="hover:underline block">💡 What is SakVerse</a></li>
                    <li><a href="#how-it-works" className="hover:underline block">🧭 How It Works</a></li>
                    <li><a href="#key-advantages" className="hover:underline block">⚙️ Key Advantages</a></li>
                    <li><a href="#comparison" className="hover:underline block">📊 Comparison</a></li>
                    <li><a href="#summary" className="hover:underline block">✅ Summary</a></li>
                    <li><a href="#faq" className="hover:underline block">📘 FAQ</a></li>
                </ul>
            </nav> */}
        <main className="h-screen w-full overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 px-6 md:px-14 pt-14 pb-20 font-sans text-gray-800">
            <div className="max-w-6xl mx-auto space-y-16">

                {/* 💡 What is SakVerse */}
                <section id="what-is-sakverse"className="space-y-6 bg-white rounded-xl shadow-lg p-8">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-700 flex items-center gap-4">
                        <FontAwesomeIcon icon={faLightbulb} className="text-yellow-500 " />
                        SakVerse: AI-Powered Test Case Generation and Requirement Analysis Platform
                    </h1>
                    <p className="text-lg leading-relaxed max-w-4xl mx-auto text-gray-700">
                        SakVerse is an advanced AI-driven platform designed to automate the generation of test cases and the analysis of requirements for Quality Assurance (QA) teams. It seamlessly transforms vague or unstructured user stories into detailed, test-ready formats, helping testers save time, improve testing quality, and maintain alignment with evolving project needs.
                    </p>
                </section>

                {/* 🧭 How SakVerse Works */}
                <section id="how-it-works" className="space-y-8">
                    <h2 className="text-3xl font-bold text-indigo-700 flex items-center gap-3">
                        <FontAwesomeIcon icon={faCompass} /> How SakVerse Works – End-to-End Workflow
                    </h2>

                    <div className="space-y-6">
                        {[{
                            title: "1. Project & User Onboarding",
                            icon: faUsers,
                            content: (
                                <>
                                    <p><strong>Project Data Setup:</strong> Upload critical project documentation such as test strategies, system architecture, domain knowledge, and more.</p>
                                    <p><strong>Project Configuration:</strong> Define environments, business domains, and integrate with external tools like JIRA or other ALM systems.</p>
                                    <p><strong>User Onboarding:</strong> Role-based access control ensures secure, structured permission tailored to user responsibilities.</p>
                                </>
                            )
                        }, {
                            title: "2. Data Security and Project Isolation",
                            icon: faShieldAlt,
                            content: (
                                <>
                                    <p><strong>Local and Secure Data Storage:</strong> All data stored securely and locally within your infrastructure.</p>
                                    <p><strong>Project Isolation:</strong> Each project operates in complete isolation — no data sharing across projects.</p>
                                    <p><strong>Evolving Knowledge Base:</strong> Continuous refinement improves accuracy and context awareness.</p>
                                </>
                            )
                        }, {
                            title: "3. User Login and Dashboard Access",
                            icon: faLock,
                            content: "Users access a personalized dashboard displaying their roles, linked projects, and current tasks."
                        }, {
                            title: "4. Core Functional Workflow – AI Agents with Human-in-the-Loop Validation",
                            icon: faRobot,
                            content: (
                                <>
                                    <p><strong>A. User Story Intake:</strong> Import user stories from JIRA or add manually; queued for analysis.</p>
                                    <p><strong className="underline">B. AI Agent Workflow:</strong></p>
                                    <ul className="list-disc pl-6 space-y-2 relative flex flex-col justify-center items-center">
                                        <li>
                                            <strong>Query Master (Knowledge Validator):</strong> Identifies knowledge gaps with color-coded indicators.
                                        </li>
                                        <li>
                                            <strong>Human-in-the-Loop:</strong> Testers add clarifications and update knowledge base.
                                        </li>

                                        <li className="flex justify-center" aria-hidden="true">
                                            <svg
                                                className="w-6 h-6 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l-4-4m4 4l4-4"></path>
                                            </svg>
                                        </li>

                                        <li>
                                            <strong>Story Builder (Documentation Enhancer):</strong> Refines user stories for clarity and detail.
                                        </li>

                                        <li>
                                            <strong>Human-in-the-Loop:</strong> Testers review and edit refined stories.
                                        </li>

                                        <li className="flex justify-center" aria-hidden="true">
                                            <svg
                                                className="w-6 h-6 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l-4-4m4 4l4-4"></path>
                                            </svg>
                                        </li>

                                        <li>
                                            <strong>Requirement Analyzer (Classifier):</strong> Breaks down stories into functional and non-functional requirements, edge cases, and testing techniques.
                                        </li>
                                        <li>
                                            <strong>Human-in-the-Loop:</strong> Users review and enrich requirements.
                                        </li>

                                        <li className="flex justify-center" aria-hidden="true">
                                            <svg
                                                className="w-6 h-6 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l-4-4m4 4l4-4"></path>
                                            </svg>
                                        </li>

                                        <li>
                                            <strong>Test Designer (Generator):</strong> Creates ISTQB-compliant test cases, prioritizes severity, identifies automation candidates.
                                        </li>
                                        <li>
                                            <strong>Human-in-the-Loop:</strong> Users refine and approve test cases.
                                        </li>
                                    </ul>

                                </>
                            )
                        }, {
                            title: "5. Post-Processing & Final Outputs",
                            icon: faFileAlt,
                            content: (
                                <>
                                    <p>After AI tasks complete, SakVerse generates:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li><strong>Requirement Traceability Matrix (RTM):</strong> Full traceability between requirements and test cases.</li>
                                        <li><strong>Test Case Accordion:</strong> Detailed test cases grouped by requirement for easy review.</li>
                                    </ul>
                                    <p>Users can publish approved test cases to Test Management Tools or download offline.</p>
                                </>
                            )
                        }, {
                            title: "6. Knowledge-Driven Continuous Improvement",
                            icon: faSyncAlt,
                            content: "Manual inputs (clarifications, edits) feed back into the knowledge base, improving AI accuracy and contextual understanding over time."
                        }].map(({ title, icon, content }, i) => (
                            <details
                                key={i}
                                className="border border-indigo-200 rounded-xl bg-white shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-300"
                                open={i === 0}
                            >
                                <summary className="font-semibold text-indigo-700 text-xl flex items-center gap-3 select-none">
                                    <FontAwesomeIcon icon={icon} />
                                    {title}
                                </summary>
                                <div className="mt-4 text-gray-700 leading-relaxed">{content}</div>
                            </details>
                        ))}
                    </div>
                </section>

                {/* 🌟 Key Advantages */}
                <section id="key-advantages" className="space-y-6 bg-indigo-50 rounded-xl p-8 shadow-inner">
                    <h2 className="text-3xl font-bold text-indigo-700 flex items-center gap-3">
                        <FontAwesomeIcon icon={faCogs} /> Key Advantages of SakVerse
                    </h2>
                    <ul className="list-disc pl-6 space-y-3 text-indigo-900 text-lg leading-relaxed">
                        <li>AI + Human Collaboration: Maintain control with human validation while leveraging AI efficiency.</li>
                        <li>Faster QA Cycles: Automate test design without compromising quality or accuracy.</li>
                        <li>Standards Compliance: Built on ISTQB standards and industry best practices.</li>
                        <li>Secure & Isolated: Data stored locally with strict project isolation.</li>
                        <li>Scalable: Supports multiple projects and teams with customizable access control.</li>
                    </ul>
                </section>

                {/* How SakVerse Outperforms Traditional Manual QA Approaches */}
                <section id="comparison" className="space-y-8">
                    <h2 className="text-3xl font-bold text-indigo-700 flex items-center gap-3">
                        <FontAwesomeIcon icon={faChartLine} /> How SakVerse Outperforms Traditional Manual QA Approaches
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border border-indigo-200 rounded-lg overflow-hidden shadow-sm">
                            <thead className="bg-indigo-100">
                                <tr>
                                    <th className="border border-indigo-300 px-6 py-3 text-left font-semibold text-indigo-800">Aspect</th>
                                    <th className="border border-indigo-300 px-6 py-3 text-left font-semibold text-indigo-800">Traditional Manual Approach</th>
                                    <th className="border border-indigo-300 px-6 py-3 text-left font-semibold text-indigo-800">SakVerse Automated Approach</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-indigo-200">
                                {[
                                    ["Test Case Design Time", "Lengthy, repetitive, error-prone", "Automated, fast, consistent"],
                                    ["Coverage", "Risk of missing edge cases", "~90%+ coverage including edge scenarios"],
                                    ["Traceability", "Often incomplete or manual", "Auto-generated RTM linking requirements & tests"],
                                    ["Sprint Speed", "Slower due to manual effort", "Accelerated with AI-driven workflows"],
                                    ["Collaboration", "Isolated, dependent on manual updates", "Integrated with human-in-the-loop validation"],
                                    ["Adaptability & Learning", "Static, no continuous learning", "Continuous improvement via feedback loop"],
                                    ["Data Security & Isolation", "Depends on process controls", "Enforced project isolation with encryption"]
                                ].map(([aspect, traditional, automated], i) => (
                                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-indigo-50"}>
                                        <td className="border border-indigo-300 px-6 py-3 font-semibold">{aspect}</td>
                                        <td className="border border-indigo-300 px-6 py-3">{traditional}</td>
                                        <td className="border border-indigo-300 px-6 py-3">{automated}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* ✅ Summary */}
                <section id="summary" className="space-y-4 bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-indigo-700 flex items-center gap-3">
                        <FontAwesomeIcon icon={faCheckCircle} /> Summary
                    </h2>
                    <p className="text-gray-700 text-lg leading-relaxed max-w-4xl mx-auto">
                        SakVerse serves as your intelligent AI co-pilot for QA — learning your project’s nuances, collaborating with your team, and transforming high-level user stories into detailed, executable test cases. This results in traceable, clear, and confident QA deliverables within a secure, smart, and human-centric platform, enabling faster, higher quality software delivery compared to traditional manual QA processes.
                    </p>
                </section>

                {/* 📘 FAQ */}
                <section id="faq" className="space-y-8">
                    <h2 className="text-3xl font-bold text-indigo-700 flex items-center gap-3">
                        <FontAwesomeIcon icon={faQuestionCircle} /> SakVerse Frequently Asked Questions (FAQ)
                    </h2>
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {[
                            ["Is our project data safe in SakVerse? How is data security handled?",
                                "Yes. All data is stored locally, encrypted, and isolated within project-specific vector databases. Your data remains private and secure, with no sharing across projects."],
                            ["How does SakVerse prevent knowledge or data leakage between projects?",
                                "SakVerse enforces strict project-level data isolation and role-based access control (RBAC), ensuring data is only accessible within its respective project environment."],
                            ["Can SakVerse learn and improve over time?",
                                "Absolutely. SakVerse continuously learns from your inputs, storing clarifications and edits to improve the AI’s accuracy and contextual understanding over time."],
                            ["Do I have to trust the AI blindly, or can I control the outputs?",
                                "No blind trust is required. SakVerse is designed with human-in-the-loop validation, enabling you to review, edit, accept, or reject outputs at every stage."],
                            ["How does SakVerse handle duplicate or similar test cases?",
                                "SakVerse avoids generating exact duplicates, instead providing diverse test case options. You select the most relevant test cases to tailor your testing strategy."],
                            ["Can SakVerse integrate with ALM tools other than JIRA?",
                                "Yes. SakVerse supports multiple ALM integrations including JIRA, Testiny, and other configurable ALM systems."],
                            ["What if SakVerse misinterprets a user story?",
                                "You can edit or clarify any misunderstood story directly. These corrections improve SakVerse’s future performance through adaptive learning."],
                            ["Who should use SakVerse?",
                                "SakVerse is ideal for QA testers, test leads, project managers, and product owners. It supports generating test cases, analyzing user stories, and tracking project progress with full traceability."]
                        ].map(([question, answer], index) => (
                            <details
                                key={index}
                                className="border border-indigo-300 rounded-xl bg-white shadow-md p-5 cursor-pointer hover:shadow-lg transition-shadow duration-300"
                            >
                                <summary className="font-semibold cursor-pointer text-lg text-indigo-700">{question}</summary>
                                <p className="mt-3 text-gray-700 text-base leading-relaxed">{answer}</p>
                            </details>
                        ))}
                    </div>
                </section>

            </div>
        </main>
        </div>
    );
}
