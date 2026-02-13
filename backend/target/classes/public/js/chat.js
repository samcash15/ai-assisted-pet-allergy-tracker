document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const btnSend = document.getElementById('btn-send');
    const chatEmpty = document.getElementById('chat-empty');
    let hasMessages = false;

    // Example prompts
    document.querySelectorAll('.example-prompt').forEach(btn => {
        btn.addEventListener('click', () => {
            chatInput.value = btn.textContent;
            chatForm.dispatchEvent(new Event('submit'));
        });
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = chatInput.value.trim();
        if (!query) return;

        // Hide empty state on first message
        if (!hasMessages) {
            chatEmpty.classList.add('hidden');
            hasMessages = true;
        }

        // Add user message
        addMessage(query, 'user');
        chatInput.value = '';
        btnSend.disabled = true;

        // Add thinking indicator
        const thinkingEl = addThinking();

        try {
            const response = await api.post('/api/chat', { query });
            thinkingEl.remove();

            // Build bot response
            let html = '';

            // Summary
            if (response.responseSummary) {
                html += `<p class="text-sm text-stone-800 leading-relaxed">${escapeHtml(response.responseSummary)}</p>`;
            }

            // Error
            if (response.error) {
                html += `<div class="mt-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg"><p class="text-sm text-rose-700">${escapeHtml(response.error)}</p></div>`;
            }

            // SQL (collapsible)
            if (response.generatedSql) {
                html += `
                    <details class="mt-3">
                        <summary class="text-xs text-teal-600 cursor-pointer hover:text-teal-800 font-medium">Show SQL</summary>
                        <pre class="mt-2 bg-stone-800 text-emerald-400 text-xs p-3 rounded-lg overflow-x-auto font-mono">${escapeHtml(response.generatedSql)}</pre>
                    </details>
                `;
            }

            // Results table
            if (response.results && response.results.length > 0) {
                html += buildResultsTable(response.results);
            }

            addMessage(html, 'bot', true);
        } catch (err) {
            thinkingEl.remove();
            addMessage(`<div class="px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg"><p class="text-sm text-rose-700">${escapeHtml(err.message)}</p></div>`, 'bot', true);
        }

        btnSend.disabled = false;
        chatInput.focus();
    });

    function addMessage(content, sender, isHtml = false) {
        const wrapper = document.createElement('div');
        wrapper.className = `chat-message flex items-start space-x-3 ${sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`;

        // Avatar
        const avatar = document.createElement('div');
        if (sender === 'user') {
            avatar.className = 'flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold';
            avatar.textContent = 'You';
        } else {
            avatar.className = 'flex-shrink-0 w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center';
            avatar.innerHTML = '<svg class="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>';
        }

        // Bubble
        const bubble = document.createElement('div');
        if (sender === 'user') {
            bubble.className = 'bg-teal-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-lg text-sm';
        } else {
            bubble.className = 'bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-2xl shadow-sm';
        }

        if (isHtml) {
            bubble.innerHTML = content;
        } else {
            bubble.textContent = content;
        }

        wrapper.appendChild(avatar);
        wrapper.appendChild(bubble);
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return wrapper;
    }

    function addThinking() {
        const wrapper = document.createElement('div');
        wrapper.className = 'chat-message flex items-start space-x-3';

        const avatar = document.createElement('div');
        avatar.className = 'flex-shrink-0 w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center';
        avatar.innerHTML = '<svg class="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>';

        const bubble = document.createElement('div');
        bubble.className = 'bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm';
        bubble.innerHTML = `
            <div class="flex items-center space-x-1.5">
                <div class="thinking-dot w-2 h-2 bg-stone-400 rounded-full"></div>
                <div class="thinking-dot w-2 h-2 bg-stone-400 rounded-full" style="animation-delay: 0.15s"></div>
                <div class="thinking-dot w-2 h-2 bg-stone-400 rounded-full" style="animation-delay: 0.3s"></div>
            </div>
        `;

        wrapper.appendChild(avatar);
        wrapper.appendChild(bubble);
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return wrapper;
    }

    function buildResultsTable(results) {
        if (results.length === 0) return '';
        const keys = Object.keys(results[0]);
        let html = '<div class="mt-3 overflow-x-auto rounded-lg border border-stone-200"><table class="w-full text-xs">';
        html += '<thead><tr class="bg-stone-50">';
        keys.forEach(k => {
            html += `<th class="px-3 py-2 text-left font-semibold text-stone-600 border-b border-stone-200">${escapeHtml(k)}</th>`;
        });
        html += '</tr></thead><tbody>';
        results.forEach((row, i) => {
            html += `<tr class="${i % 2 === 0 ? '' : 'bg-stone-50'}">`;
            keys.forEach(k => {
                html += `<td class="px-3 py-2 text-stone-700 border-b border-stone-100">${row[k] != null ? escapeHtml(String(row[k])) : '\u2014'}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table></div>';
        return html;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
