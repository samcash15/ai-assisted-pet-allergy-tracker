document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const petId = params.get('petId');
    if (!petId) { window.location.href = '/pets.html'; return; }

    // Load pet info
    try {
        const pet = await api.get(`/api/pets/${petId}`);
        document.getElementById('pet-name').textContent = pet.name;
        document.getElementById('pet-avatar').textContent = pet.name.charAt(0).toUpperCase();
        const age = pet.dateOfBirth ? calculateAge(pet.dateOfBirth) : '';
        document.getElementById('pet-info').textContent =
            `${pet.species}${pet.breed ? ' \u00b7 ' + pet.breed : ''}${age ? ' \u00b7 ' + age : ''}`;
    } catch (err) {
        showError('Pet not found');
        return;
    }

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('tab-active');
                b.classList.add('text-stone-500');
            });
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            btn.classList.add('tab-active');
            btn.classList.remove('text-stone-500');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
        });
    });

    // ---- SYMPTOMS ----
    const symptomTypes = await api.get('/api/symptom-types');
    const symptomSelect = document.getElementById('symptom-type-select');
    symptomTypes.forEach(st => {
        const opt = document.createElement('option');
        opt.value = st.symptomTypeId;
        opt.textContent = st.name;
        symptomSelect.appendChild(opt);
    });

    const severitySlider = document.getElementById('symptom-severity');
    const severityBadge = document.getElementById('severity-value');
    severitySlider.addEventListener('input', () => {
        const val = parseInt(severitySlider.value);
        severityBadge.textContent = val;
        severityBadge.className = 'inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold';
        if (val <= 3) severityBadge.classList.add('bg-emerald-100', 'text-emerald-700');
        else if (val <= 6) severityBadge.classList.add('bg-amber-100', 'text-amber-700');
        else severityBadge.classList.add('bg-rose-100', 'text-rose-700');
    });

    document.getElementById('btn-add-symptom').addEventListener('click', () => {
        document.getElementById('symptom-form-container').classList.toggle('open');
        setDefaultDateTime('symptom-datetime');
    });
    document.getElementById('btn-cancel-symptom').addEventListener('click', () => {
        document.getElementById('symptom-form-container').classList.remove('open');
    });

    document.getElementById('symptom-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const dt = document.getElementById('symptom-datetime').value;
            await api.post(`/api/pets/${petId}/symptoms`, {
                symptomTypeId: parseInt(symptomSelect.value),
                severity: parseInt(severitySlider.value),
                notes: document.getElementById('symptom-notes').value.trim() || null,
                loggedAt: dt ? new Date(dt).toISOString() : null
            });
            document.getElementById('symptom-form').reset();
            severityBadge.textContent = '5';
            severityBadge.className = 'inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-700 text-sm font-bold';
            severitySlider.value = 5;
            document.getElementById('symptom-form-container').classList.remove('open');
            showToast('Symptom logged!', 'success');
            loadSymptoms();
        } catch (err) { showError('Failed to log symptom: ' + err.message); }
    });

    document.getElementById('btn-filter-symptoms').addEventListener('click', () => loadSymptoms());
    document.getElementById('btn-clear-symptom-filter').addEventListener('click', () => {
        document.getElementById('symptom-from').value = '';
        document.getElementById('symptom-to').value = '';
        loadSymptoms();
    });

    async function loadSymptoms() {
        try {
            let url = `/api/pets/${petId}/symptoms`;
            const from = document.getElementById('symptom-from').value;
            const to = document.getElementById('symptom-to').value;
            if (from && to) {
                url += `?from=${new Date(from).toISOString()}&to=${new Date(to + 'T23:59:59').toISOString()}`;
            }
            const symptoms = await api.get(url);
            const tbody = document.getElementById('symptom-table-body');
            tbody.innerHTML = '';
            document.getElementById('no-symptoms').classList.toggle('hidden', symptoms.length > 0);

            // Update header stats
            document.getElementById('pet-symptom-count').textContent = symptoms.length;
            if (symptoms.length > 0) {
                const avg = symptoms.reduce((s, x) => s + x.severity, 0) / symptoms.length;
                document.getElementById('pet-avg-severity').textContent = avg.toFixed(1);
            }

            symptoms.forEach(s => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-stone-100 hover:bg-stone-50';
                tr.innerHTML = `
                    <td class="p-3 text-stone-600">${formatDateTime(s.loggedAt)}</td>
                    <td class="p-3 font-medium">${s.symptomTypeName || '\u2014'}</td>
                    <td class="p-3">
                        <div class="flex items-center space-x-2">
                            <div class="w-16 bg-stone-100 rounded-full h-1.5">
                                <div class="h-1.5 rounded-full ${severityBarColor(s.severity)}" style="width: ${s.severity * 10}%"></div>
                            </div>
                            <span class="text-xs font-medium text-stone-600">${s.severity}</span>
                        </div>
                    </td>
                    <td class="p-3 text-stone-400 max-w-xs truncate">${s.notes || '\u2014'}</td>
                    <td class="p-3"><button class="text-rose-500 hover:text-rose-700 text-xs delete-symptom" data-id="${s.symptomLogId}">Delete</button></td>
                `;
                tbody.appendChild(tr);
            });
            tbody.querySelectorAll('.delete-symptom').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('Delete this symptom log?')) return;
                    try { await api.del(`/api/symptoms/${btn.dataset.id}`); showToast('Deleted', 'info'); loadSymptoms(); }
                    catch (err) { showError('Delete failed: ' + err.message); }
                });
            });
        } catch (err) { showError('Failed to load symptoms: ' + err.message); }
    }

    // ---- TREATMENTS ----
    const treatmentTypes = await api.get('/api/treatment-types');
    const treatmentSelect = document.getElementById('treatment-type-select');
    treatmentTypes.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.treatmentId;
        opt.textContent = `${t.name} (${t.treatmentType})`;
        treatmentSelect.appendChild(opt);
    });

    document.getElementById('btn-add-treatment').addEventListener('click', () => {
        document.getElementById('treatment-form-container').classList.toggle('open');
        setDefaultDateTime('treatment-datetime');
    });
    document.getElementById('btn-cancel-treatment').addEventListener('click', () => {
        document.getElementById('treatment-form-container').classList.remove('open');
    });

    document.getElementById('treatment-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const dt = document.getElementById('treatment-datetime').value;
            await api.post(`/api/pets/${petId}/treatments`, {
                treatmentId: parseInt(treatmentSelect.value),
                dosage: document.getElementById('treatment-dosage').value.trim() || null,
                notes: document.getElementById('treatment-notes').value.trim() || null,
                administeredAt: dt ? new Date(dt).toISOString() : null
            });
            document.getElementById('treatment-form').reset();
            document.getElementById('treatment-form-container').classList.remove('open');
            showToast('Treatment logged!', 'success');
            loadTreatments();
        } catch (err) { showError('Failed to log treatment: ' + err.message); }
    });

    document.getElementById('btn-filter-treatments').addEventListener('click', () => loadTreatments());
    document.getElementById('btn-clear-treatment-filter').addEventListener('click', () => {
        document.getElementById('treatment-from').value = '';
        document.getElementById('treatment-to').value = '';
        loadTreatments();
    });

    async function loadTreatments() {
        try {
            let url = `/api/pets/${petId}/treatments`;
            const from = document.getElementById('treatment-from').value;
            const to = document.getElementById('treatment-to').value;
            if (from && to) {
                url += `?from=${new Date(from).toISOString()}&to=${new Date(to + 'T23:59:59').toISOString()}`;
            }
            const treatments = await api.get(url);
            const tbody = document.getElementById('treatment-table-body');
            tbody.innerHTML = '';
            document.getElementById('no-treatments').classList.toggle('hidden', treatments.length > 0);
            document.getElementById('pet-treatment-count').textContent = treatments.length;

            treatments.forEach(t => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-stone-100 hover:bg-stone-50';
                tr.innerHTML = `
                    <td class="p-3 text-stone-600">${formatDateTime(t.administeredAt)}</td>
                    <td class="p-3 font-medium">${t.treatmentName || '\u2014'}</td>
                    <td class="p-3"><span class="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">${t.treatmentType || '\u2014'}</span></td>
                    <td class="p-3">${t.dosage || '\u2014'}</td>
                    <td class="p-3 text-stone-400 max-w-xs truncate">${t.notes || '\u2014'}</td>
                    <td class="p-3"><button class="text-rose-500 hover:text-rose-700 text-xs delete-treatment" data-id="${t.treatmentLogId}">Delete</button></td>
                `;
                tbody.appendChild(tr);
            });
            tbody.querySelectorAll('.delete-treatment').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('Delete this treatment log?')) return;
                    try { await api.del(`/api/treatments/${btn.dataset.id}`); showToast('Deleted', 'info'); loadTreatments(); }
                    catch (err) { showError('Delete failed: ' + err.message); }
                });
            });
        } catch (err) { showError('Failed to load treatments: ' + err.message); }
    }

    // ---- ENVIRONMENTAL FACTORS ----
    const envTypes = await api.get('/api/env-factor-types');
    const envSelect = document.getElementById('env-type-select');
    envTypes.forEach(et => {
        const opt = document.createElement('option');
        opt.value = et.envFactorTypeId;
        opt.textContent = `${et.name}${et.unit ? ' (' + et.unit + ')' : ''}`;
        envSelect.appendChild(opt);
    });

    document.getElementById('btn-add-env').addEventListener('click', () => {
        document.getElementById('env-form-container').classList.toggle('open');
        setDefaultDateTime('env-datetime');
    });
    document.getElementById('btn-cancel-env').addEventListener('click', () => {
        document.getElementById('env-form-container').classList.remove('open');
    });

    document.getElementById('env-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const dt = document.getElementById('env-datetime').value;
            await api.post(`/api/pets/${petId}/env-factors`, {
                envFactorTypeId: parseInt(envSelect.value),
                value: parseFloat(document.getElementById('env-value').value),
                notes: document.getElementById('env-notes').value.trim() || null,
                loggedAt: dt ? new Date(dt).toISOString() : null
            });
            document.getElementById('env-form').reset();
            document.getElementById('env-form-container').classList.remove('open');
            showToast('Factor logged!', 'success');
            loadEnvFactors();
        } catch (err) { showError('Failed to log factor: ' + err.message); }
    });

    document.getElementById('btn-filter-env').addEventListener('click', () => loadEnvFactors());
    document.getElementById('btn-clear-env-filter').addEventListener('click', () => {
        document.getElementById('env-from').value = '';
        document.getElementById('env-to').value = '';
        loadEnvFactors();
    });

    async function loadEnvFactors() {
        try {
            let url = `/api/pets/${petId}/env-factors`;
            const from = document.getElementById('env-from').value;
            const to = document.getElementById('env-to').value;
            if (from && to) {
                url += `?from=${new Date(from).toISOString()}&to=${new Date(to + 'T23:59:59').toISOString()}`;
            }
            const factors = await api.get(url);
            const tbody = document.getElementById('env-table-body');
            tbody.innerHTML = '';
            document.getElementById('no-env').classList.toggle('hidden', factors.length > 0);

            factors.forEach(f => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-stone-100 hover:bg-stone-50';
                tr.innerHTML = `
                    <td class="p-3 text-stone-600">${formatDateTime(f.loggedAt)}</td>
                    <td class="p-3 font-medium">${f.envFactorTypeName || '\u2014'}</td>
                    <td class="p-3">${f.value}${f.envFactorTypeUnit ? ' ' + f.envFactorTypeUnit : ''}</td>
                    <td class="p-3 text-stone-400 max-w-xs truncate">${f.notes || '\u2014'}</td>
                    <td class="p-3"><button class="text-rose-500 hover:text-rose-700 text-xs delete-env" data-id="${f.envFactorLogId}">Delete</button></td>
                `;
                tbody.appendChild(tr);
            });
            tbody.querySelectorAll('.delete-env').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('Delete this environmental factor log?')) return;
                    try { await api.del(`/api/env-factors/${btn.dataset.id}`); showToast('Deleted', 'info'); loadEnvFactors(); }
                    catch (err) { showError('Delete failed: ' + err.message); }
                });
            });
        } catch (err) { showError('Failed to load env factors: ' + err.message); }
    }

    // Helpers
    function calculateAge(dobStr) {
        const dob = new Date(dobStr);
        const now = new Date();
        let years = now.getFullYear() - dob.getFullYear();
        let months = now.getMonth() - dob.getMonth();
        if (months < 0) { years--; months += 12; }
        if (years > 0) return `${years} year${years !== 1 ? 's' : ''} old`;
        return `${months} month${months !== 1 ? 's' : ''} old`;
    }

    function setDefaultDateTime(inputId) {
        const el = document.getElementById(inputId);
        if (!el.value) {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            el.value = now.toISOString().slice(0, 16);
        }
    }

    // Initial load
    loadSymptoms();
    loadTreatments();
    loadEnvFactors();
});
