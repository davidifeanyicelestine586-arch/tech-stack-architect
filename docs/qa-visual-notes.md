# Migration QA Visual Notes

After restarting the production server against the current build, all six requested viewport captures loaded the Shadcn styling correctly. The 1440px, 1280px, 1024px, and 768px captures show the inset sidebar, bordered content frame, sticky header, template-style cards, compact typography, and product-specific workspace content. The 390px mobile capture shows the desktop sidebar collapsed away, a mobile header with logo, sidebar toggle, and theme toggle, and a single-column content layout with readable cards and no visible horizontal clipping. The 375px capture follows the same mobile pattern.

The initial unstyled captures were caused by a stale Next.js production process serving an outdated CSS manifest while the build directory had been regenerated, not by the application code. The stale process was stopped, the current production server was restarted, and the captures were repeated successfully.

Interactive theme QA passed in the production browser. After toggling the header theme control, the document class became `style-lyra dark`; the body rendered a dark background (`lab(2.75381 0 0)`) with a light foreground (`lab(98.26 0 0)`), and the 1280px interactive viewport reported no horizontal overflow. The dark screenshot showed readable sidebar labels, cards, inputs, borders, validation status, and action buttons.

A fresh production navigation reset the workspace successfully. The canonical sidebar links, header search, GitHub link, theme control, product hero, project form, and component catalog were all visible. The theme toggle was then used again during the QA run; the dark appearance retained readable text, controls, cards, borders, and validation-state colors.

The clean QA run reset to light mode and populated the required AI Document Q&A Platform fields successfully. The light-mode workspace retained the template shell and readable product controls; the project name, description, and goals were accepted by the form.

The clean interactive workflow successfully submitted the AI Document Q&A Platform definition and rendered deterministic recommendations. Adding the top recommendation changed the component catalog to show Next.js as Selected, created a one-node selected stack, surfaced its two missing dependencies, and rendered the validation report and recipe matches. This confirms the Define → Analyze → Recommendations → Add recommendation → Selected Stack → Validation transition.

The manual workflow changed the project domain to AI & Automation and re-analyzed successfully. The catalog narrowed to 7 AI & Automation nodes, with the selected stack retaining the previously added Next.js and showing the expected missing dependency state. This confirms domain selection updates the catalog and validation context without replacing the manual workflow.

The manual workflow then selected the Model Context Protocol Server from the AI & Automation catalog. The selected stack increased to 2 nodes, validation showed the expected missing dependencies, and the Add Missing Dependencies action resolved Node.js, Vercel, LLM Gateway, and Secure Token Vault. The selected stack reached 6 nodes and the validation report changed to 100% Match / Production Ready with only the expected product warnings. This confirms the Domain → Catalog → Component → Selected Stack → Validation path and dependency resolution behavior.
