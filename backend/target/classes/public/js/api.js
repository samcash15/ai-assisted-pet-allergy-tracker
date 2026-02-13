const api = {
    async get(url) {
        const response = await fetch(url);
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || response.statusText);
        }
        if (response.status === 204) return null;
        return response.json();
    },

    async post(url, body) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || response.statusText);
        }
        if (response.status === 204) return null;
        return response.json();
    },

    async put(url, body) {
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || response.statusText);
        }
        return response.json();
    },

    async del(url) {
        const response = await fetch(url, { method: 'DELETE' });
        if (!response.ok && response.status !== 204) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || response.statusText);
        }
        return true;
    }
};

function formatDate(isoString) {
    if (!isoString) return '\u2014';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(isoString) {
    if (!isoString) return '\u2014';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
           ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function timeAgo(isoString) {
    const seconds = Math.floor((new Date() - new Date(isoString)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(isoString);
}

function severityColor(severity) {
    if (severity <= 3) return 'bg-emerald-100 text-emerald-700';
    if (severity <= 6) return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
}

function severityBarColor(severity) {
    if (severity <= 3) return 'bg-emerald-500';
    if (severity <= 6) return 'bg-amber-500';
    return 'bg-rose-500';
}

function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    const colors = {
        error: 'bg-rose-600 text-white',
        success: 'bg-emerald-600 text-white',
        info: 'bg-teal-600 text-white'
    };
    toast.className = `fixed bottom-4 right-4 z-50 ${colors[type]} px-4 py-3 rounded-xl shadow-lg text-sm max-w-sm
                        transform transition-all duration-300 translate-y-2 opacity-0`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    });
    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function showError(message) {
    showToast(message, 'error');
}

/**
 * Render an inline SVG sparkline into a container element.
 */
function renderSparkline(container, data, opts = {}) {
    if (!data || data.length < 2) {
        container.innerHTML = '<span class="text-xs text-stone-300">Not enough data</span>';
        return;
    }
    const w = opts.width || container.clientWidth || 120;
    const h = opts.height || 32;
    const stroke = opts.stroke || '#0d9488';
    const fill = opts.fill || '#ccfbf1';
    const sw = opts.strokeWidth || 1.5;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 4) - 2;
        return `${x},${y}`;
    });

    const polyline = points.join(' ');
    const areaPoints = `0,${h} ${polyline} ${w},${h}`;
    const lastX = w;
    const lastY = h - ((data[data.length - 1] - min) / range) * (h - 4) - 2;

    container.innerHTML = `
        <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="overflow-visible">
            <polygon points="${areaPoints}" fill="${fill}" opacity="0.5"/>
            <polyline points="${polyline}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="${lastX}" cy="${lastY}" r="2.5" fill="${stroke}"/>
        </svg>
    `;
}

/**
 * Render horizontal bar chart items into a container.
 */
function renderHorizontalBars(containerId, items, maxValue) {
    const container = document.getElementById(containerId);
    if (!container || !items.length) return;
    container.innerHTML = items.map(item => {
        const pct = Math.round((item.value / maxValue) * 100);
        return `
            <div class="flex items-center space-x-3">
                <span class="text-xs text-stone-600 w-28 truncate">${item.label}</span>
                <div class="flex-grow bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div class="h-full rounded-full ${item.color || 'bg-teal-500'} transition-all duration-700"
                         style="width: ${pct}%"></div>
                </div>
                <span class="text-xs font-medium text-stone-500 w-8 text-right">${item.value}</span>
            </div>
        `;
    }).join('');
}

/**
 * Render a stacked severity distribution bar.
 */
function renderSeverityDistribution(containerId, symptoms) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const buckets = { low: 0, mid: 0, high: 0 };
    symptoms.forEach(s => {
        if (s.severity <= 3) buckets.low++;
        else if (s.severity <= 6) buckets.mid++;
        else buckets.high++;
    });
    const total = symptoms.length || 1;

    container.innerHTML = `
        <div class="flex rounded-full overflow-hidden h-4 bg-stone-100">
            <div class="bg-emerald-400 transition-all duration-700" style="width: ${(buckets.low / total) * 100}%"></div>
            <div class="bg-amber-400 transition-all duration-700" style="width: ${(buckets.mid / total) * 100}%"></div>
            <div class="bg-rose-400 transition-all duration-700" style="width: ${(buckets.high / total) * 100}%"></div>
        </div>
        <div class="flex justify-between mt-3 text-xs text-stone-500">
            <span class="flex items-center space-x-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span><span>Low 1-3 (${buckets.low})</span></span>
            <span class="flex items-center space-x-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span><span>Medium 4-6 (${buckets.mid})</span></span>
            <span class="flex items-center space-x-1.5"><span class="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span><span>High 7-10 (${buckets.high})</span></span>
        </div>
    `;
}
