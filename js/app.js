/**
 * UI Rendering Architecture Engine
 * Consumes single source of truth structure to draw responsive DOM structures.
 */

window.ProfileEngine = {
    data: null,
    listeners: [],
    onReady(callback) {
        if (this.data) callback(this.data);
        else this.listeners.push(callback);
    },
    broadcast(data) {
        this.data = data;
        this.listeners.forEach(cb => cb(data));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    fetchProfileData();
});

async function fetchProfileData() {
    try {
        const response = await fetch('data/profile-data.json');
        if (!response.ok) throw new Error(`HTTP network degradation error: ${response.status}`);
        const data = await response.json();
        
        // Broadcast to subscriber frameworks (AI Engine)
        window.ProfileEngine.broadcast(data);
        
        // Process UI rendering execution chains
        renderSidebar(data.basics);
        renderSkills(data.skills);
        renderTimeline(data.experience);
        renderProjects(data.projects);
    } catch (error) {
        console.error('Fatal initialization error in Core Engine Layer:', error);
        document.getElementById('profile-card-target').innerHTML = `
            <div style="color: #ff4a4a; font-size: 0.9rem;">
                Execution failure reading dynamic profiles. Verify data/profile-data.json exists.
            </div>
        `;
    }
}

function renderSidebar(basics) {
    const target = document.getElementById('profile-card-target');
    target.innerHTML = `
        <h1>${basics.name}</h1>
        <div class="title">${basics.label}</div>
        <p class="summary">${basics.summary}</p>
        <div class="status-badge">
            <span class="status-dot"></span>
            <span>${basics.status}</span>
        </div>
        <div style="margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-secondary);">
            <div>📍 ${basics.location}</div>
            <div style="margin-top: 0.25rem;">✉️ ${basics.email}</div>
        </div>
    `;
}

function renderSkills(skills) {
    const target = document.getElementById('skills-grid-target');
    target.innerHTML = skills.map(skill => `
        <div class="skill-tag" data-category="${skill.category}">
            ${skill.name}
        </div>
    `).join('');
}

function renderTimeline(experience) {
    const target = document.getElementById('timeline-target');
    target.innerHTML = experience.map(exp => `
        <article class="timeline-item">
            <div class="timeline-header">
                <span class="timeline-company">${exp.company}</span>
                <span class="timeline-duration">${exp.duration}</span>
            </div>
            <div class="timeline-role">${exp.position}</div>
            <ul class="timeline-bullets">
                ${exp.highlights.map(point => `<li>${point}</li>`).join('')}
            </ul>
        </article>
    `).join('');
}

function renderProjects(projects) {
    const target = document.getElementById('projects-target');
    target.innerHTML = projects.map(proj => `
        <div class="project-card">
            <div>
                <h3 class="project-title">${proj.title}</h3>
                <p class="project-desc">${proj.description}</p>
                <div class="project-tech-stack">
                    ${proj.techStack.map(tech => `<span class="tech-mini-tag">${tech}</span>`).join('')}
                </div>
            </div>
            <a href="${proj.link}" target="_blank" rel="noopener noreferrer" class="project-link">
                Analyze Source Code
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                </svg>
            </a>
        </div>
    `).join('');
}
