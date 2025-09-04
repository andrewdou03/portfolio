export type Seed = {
  category: string;
  question: string;
  sources: string[];
  weight: number;
};
const seeds: Seed[] = [
  {
    category: "Portfolio/Process",
    weight: 5,
    sources: ["https://www.nngroup.com/articles/ux-design-portfolios/"],
    question:
      "What problem did you solve in your most impactful project, and what constraints did you face?",
  },
  {
    category: "Portfolio/Process",
    weight: 5,
    sources: [
      "https://www.interaction-design.org/literature/article/design-a-stand-out-ui-design-portfolio",
    ],
    question: "What measurable outcomes did your work achieve?",
  },
  {
    category: "Frontend/Performance",
    weight: 5,
    sources: [],
    question:
      "How do you diagnose and fix a React app that regressed from 2s to 6s load time?",
  },
  {
    category: "3D/Animation",
    weight: 5,
    sources: [],
    question:
      "How do you balance visual fidelity with performance in R3F/Three.js scenes?",
  },
  {
    category: "Freelance/Logistics",
    weight: 5,
    sources: [
      "https://www.business.com/articles/questions-to-ask-web-developer/",
    ],
    question:
      "What is your project process and typical timeline from discovery to launch?",
  },
  {
    category: "Fit",
    weight: 3,
    sources: [],
    question:
      "What types of projects excite you most, and what don’t you take on?",
  },
];
export default seeds;
