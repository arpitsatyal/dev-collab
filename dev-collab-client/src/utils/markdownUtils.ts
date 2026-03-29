export const formatPlanToMarkdown = (planObj: any): string => {
    if (!planObj) return "";
    if (typeof planObj === "string") return planObj;

    let md = `# Implementation Plan\n\n`;
    if (planObj.summary) md += `${planObj.summary}\n\n`;

    if (planObj.steps && Array.isArray(planObj.steps)) {
        md += `## Steps\n`;
        planObj.steps.forEach((step: any, index: number) => {
            md += `### ${index + 1}. ${step.title}\n${step.detail}\n\n`;
        });
    }

    if (planObj.risks && Array.isArray(planObj.risks) && planObj.risks.length > 0) {
        md += `## Risks\n`;
        planObj.risks.forEach((risk: string) => {
            md += `- ${risk}\n`;
        });
        md += `\n`;
    }

    if (planObj.estimated_effort) {
        md += `## Estimated Effort\n${planObj.estimated_effort}\n`;
    }

    return md;
};

export const markdownToHTML = (md: string) => {
    let ht = md.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    ht = ht.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    ht = ht.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    const lines = ht.split('\n');
    let inList = false;
    let newHtml = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) {
            if (inList) { newHtml += '</ul>'; inList = false; }
            continue; 
        }
        
        if (line.startsWith('- ')) {
            if (!inList) { newHtml += '<ul>'; inList = true; }
            newHtml += `<li>${line.substring(2)}</li>`;
            continue;
        } else if (inList) {
            newHtml += '</ul>';
            inList = false;
        }
        
        if (line.startsWith('<h')) {
            newHtml += line;
        } else {
            newHtml += `<p>${line}</p>`;
        }
    }
    if (inList) newHtml += '</ul>';
    
    return newHtml;
};
