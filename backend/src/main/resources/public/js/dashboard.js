document.addEventListener('DOMContentLoaded', async () => {
    try {
        const pets = await api.get('/api/pets');
        document.getElementById('total-pets').textContent = pets.length;

        if (pets.length === 0) {
            document.getElementById('symptoms-this-week').textContent = '0';
            document.getElementById('avg-severity').textContent = '\u2014';
            document.getElementById('treatments-this-week').textContent = '0';
            document.getElementById('no-symptoms').classList.remove('hidden');
            return;
        }

        // Render pet switcher
        const switcher = document.getElementById('pet-switcher');
        pets.forEach((pet, i) => {
            const btn = document.createElement('button');
            btn.className = i === 0
                ? 'px-3 py-1 rounded-full text-sm font-medium bg-teal-600 text-white'
                : 'px-3 py-1 rounded-full text-sm font-medium bg-stone-100 text-stone-600 hover:bg-stone-200';
            btn.textContent = pet.name;
            btn.addEventListener('click', () => {
                switcher.querySelectorAll('button').forEach(b => {
                    b.className = 'px-3 py-1 rounded-full text-sm font-medium bg-stone-100 text-stone-600 hover:bg-stone-200';
                });
                btn.className = 'px-3 py-1 rounded-full text-sm font-medium bg-teal-600 text-white';
                loadDashboard(pet.petId, pet.name);
            });
            switcher.appendChild(btn);
        });

        loadDashboard(pets[0].petId, pets[0].name);

    } catch (err) {
        showError('Failed to load dashboard: ' + err.message);
    }
});

async function loadDashboard(petId, petName) {
    try {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const from = weekAgo.toISOString();
        const to = now.toISOString();

        const [weekSymptoms, weekTreatments, allSymptoms] = await Promise.all([
            api.get(`/api/pets/${petId}/symptoms?from=${from}&to=${to}`),
            api.get(`/api/pets/${petId}/treatments?from=${from}&to=${to}`),
            api.get(`/api/pets/${petId}/symptoms`)
        ]);

        // Summary cards
        document.getElementById('symptoms-this-week').textContent = weekSymptoms.length;
        document.getElementById('treatments-this-week').textContent = weekTreatments.length;

        if (weekSymptoms.length > 0) {
            const avgSev = weekSymptoms.reduce((sum, s) => sum + s.severity, 0) / weekSymptoms.length;
            document.getElementById('avg-severity').textContent = avgSev.toFixed(1);
        } else {
            document.getElementById('avg-severity').textContent = '\u2014';
        }

        // Sparkline from last 14 days of daily avg severity
        const sparkData = buildDailySeverity(allSymptoms, 14);
        renderSparkline(document.getElementById('severity-sparkline'), sparkData);

        // Severity distribution
        renderSeverityDistribution('severity-distribution', allSymptoms);

        // Top symptoms bar chart
        const symptomCounts = {};
        allSymptoms.forEach(s => {
            const name = s.symptomTypeName || 'Unknown';
            symptomCounts[name] = (symptomCounts[name] || 0) + 1;
        });
        const sorted = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
        const maxCount = sorted.length > 0 ? sorted[0][1] : 1;
        const barColors = ['bg-teal-500', 'bg-teal-400', 'bg-teal-300', 'bg-stone-400', 'bg-stone-300', 'bg-stone-300'];
        renderHorizontalBars('top-symptoms', sorted.map(([label, value], i) => ({
            label, value, color: barColors[i] || 'bg-teal-500'
        })), maxCount);

        // Recent symptoms table
        const recent = allSymptoms.slice(0, 10);
        const tbody = document.getElementById('recent-symptoms');
        tbody.innerHTML = '';

        if (recent.length === 0) {
            document.getElementById('no-symptoms').classList.remove('hidden');
            return;
        }
        document.getElementById('no-symptoms').classList.add('hidden');

        recent.forEach(s => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-stone-100 hover:bg-stone-50';
            tr.innerHTML = `
                <td class="py-3 pr-3 text-stone-600">${timeAgo(s.loggedAt)}</td>
                <td class="py-3 pr-3 font-medium text-stone-800">${petName}</td>
                <td class="py-3 pr-3">${s.symptomTypeName || '\u2014'}</td>
                <td class="py-3 pr-3">
                    <div class="flex items-center space-x-2">
                        <div class="w-16 bg-stone-100 rounded-full h-1.5">
                            <div class="h-1.5 rounded-full ${severityBarColor(s.severity)}" style="width: ${s.severity * 10}%"></div>
                        </div>
                        <span class="text-xs font-medium text-stone-600">${s.severity}</span>
                    </div>
                </td>
                <td class="py-3 text-stone-400 max-w-xs truncate">${s.notes || '\u2014'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        showError('Failed to load dashboard data: ' + err.message);
    }
}

function buildDailySeverity(symptoms, days) {
    const now = new Date();
    const dailyMap = {};
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        dailyMap[d.toISOString().slice(0, 10)] = [];
    }
    symptoms.forEach(s => {
        const day = new Date(s.loggedAt).toISOString().slice(0, 10);
        if (dailyMap[day] !== undefined) {
            dailyMap[day].push(s.severity);
        }
    });
    return Object.values(dailyMap).map(vals =>
        vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    );
}
