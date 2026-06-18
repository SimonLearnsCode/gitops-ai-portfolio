/**
 * Smart Recruiter AI Agent runtime script.
 * Upgraded validation structure matching modern secure AQ. token signatures.
 */

(function () {
    let systemContextPrompt = "";
    let chatbotVisible = false;

    // Interface DOM selectors
    const widgetEl = document.getElementById('ai-agent-widget');
    const triggerBtn = document.getElementById('ai-trigger');
    const closeBtn = document.getElementById('ai-close');
    const chatWindow = document.getElementById('ai-chat-window');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('chat-messages-target');
    const chipsContainer = document.getElementById('chips-container-target');

    // Subscribe to Profile Engine Core to build context dynamically
    window.ProfileEngine.onReady((profileData) => {
        buildSystemContext(profileData);
    });

    // Toggle panel view states
    triggerBtn.addEventListener('click', toggleChatbot);
    closeBtn.addEventListener('click', toggleChatbot);

    function toggleChatbot() {
        chatbotVisible = !chatbotVisible;
        chatWindow.classList.toggle('active', chatbotVisible);
        chatWindow.setAttribute('aria-hidden', (!chatbotVisible).toString());
        if (chatbotVisible) chatInput.focus();
    }

    // Intercept preset user contextual microchips
    chipsContainer.addEventListener('click', (e) => {
        const targetChip = e.target.closest('.prompt-chip');
        if (!targetChip) return;
        const queryText = targetChip.getAttribute('data-prompt');
        chatInput.value = queryText;
        executeAgentInference(queryText);
    });

    // Intercept manual keyboard forms submission
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const queryText = chatInput.value.trim();
        if (!queryText) return;
        executeAgentInference(queryText);
    });

    function buildSystemContext(data) {
        systemContextPrompt = `You are the dedicated AI Agent representing ${data.basics.name}. You have absolute knowledge of their professional history based on this valid dataset: ${JSON.stringify(data)}.
Guidelines:
1. Actively behave like an elite agent representing an enterprise engineering asset.
2. Answer inquiries professionally, confidently, and concisely. Keep answers to 2-3 structured paragraphs max or clean bullet points.
3. If an input is completely unrelated to professional engineering, recruitment, or background alignment checks, politely pivot back to career highlights.`;
    }

    async function executeAgentInference(promptText) {
        // Render user message to track flow
        appendMessage(promptText, 'user-msg');
        chatInput.value = '';

        // Render runtime typing element animation
        const skeletonLoader = appendSkeletonLoader();
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            // Locate client key safely mapped inside local storage or layout scopes
            const apiKey = localStorage.getItem('GEMINI_API_KEY') || window.ENV_GEMINI_API_KEY;

            if (!apiKey) {
                removeLoader(skeletonLoader);
                appendMessage("System Alert: API deployment variable missing. Please supply your valid secure key inside your local storage instance under 'GEMINI_API_KEY' to run live requests.", 'ai-msg');
                return;
            }

            // High-stability text extraction target URL endpoint
            const targetEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

            // Dispatch post request implementing the necessary x-goog-api-key authentication token header
            const response = await fetch(targetEndpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                { text: `${systemContextPrompt}\n\nUser Question: ${promptText}` }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 600
                    }
                })
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error?.message || `Gateway returned bad tracking status code: ${response.status}`);
            }

            const payload = await response.json();
            removeLoader(skeletonLoader);

            const verifiedText = payload.candidates?.[0]?.content?.parts?.[0]?.text || "I was unable to extract context matching that request. Please try again.";
            appendMessage(formatInlineMarkdown(verifiedText), 'ai-msg');

        } catch (error) {
            console.error('AI Processing Pipeline Interruption:', error);
            removeLoader(skeletonLoader);
            appendMessage(`Connection Error: ${error.message}. Ensure your API key is correct and valid for your region.`, 'ai-msg');
        }

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function appendMessage(text, CSSStyleClass) {
        const bubble = document.createElement('div');
        bubble.className = `message ${CSSStyleClass}`;
        bubble.innerHTML = text;
        messagesContainer.appendChild(bubble);
    }

    function appendSkeletonLoader() {
        const wrapper = document.createElement('div');
        wrapper.className = 'message ai-msg runtime-skeleton-item';
        wrapper.innerHTML = `
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        `;
        messagesContainer.appendChild(wrapper);
        return wrapper;
    }

    function removeLoader(elementRef) {
        if (elementRef && elementRef.parentNode) {
            elementRef.parentNode.removeChild(elementRef);
        }
    }

    function formatInlineMarkdown(rawStr) {
        let cleaned = rawStr
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1); padding:2px 4px; border-radius:4px;">$1</code>')
            .replace(/\n/g, '<br>');
        return cleaned;
    }
})();
