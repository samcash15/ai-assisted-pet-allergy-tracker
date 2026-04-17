document.addEventListener('DOMContentLoaded', async () => {
    const petList = document.getElementById('pet-list');
    const noPets = document.getElementById('no-pets');
    const modal = document.getElementById('add-pet-modal');
    const form = document.getElementById('add-pet-form');

    document.getElementById('btn-add-pet').addEventListener('click', () => modal.classList.remove('hidden'));
    ['btn-cancel-pet', 'btn-cancel-pet-form'].forEach(id => {
        document.getElementById(id).addEventListener('click', () => modal.classList.add('hidden'));
    });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const pet = {
                name: document.getElementById('pet-name').value.trim(),
                species: document.getElementById('pet-species').value.trim(),
                breed: document.getElementById('pet-breed').value.trim() || null,
                dateOfBirth: document.getElementById('pet-dob').value || null
            };
            await api.post('/api/pets', pet);
            modal.classList.add('hidden');
            form.reset();
            showToast('Pet added successfully!', 'success');
            loadPets();
        } catch (err) {
            showError('Failed to add pet: ' + err.message);
        }
    });

    async function loadPets() {
        try {
            const pets = await api.get('/api/pets');
            petList.innerHTML = '';
            if (pets.length === 0) {
                noPets.classList.remove('hidden');
                return;
            }
            noPets.classList.add('hidden');

            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const from = weekAgo.toISOString();
            const to = now.toISOString();

            const weekSymptoms = await Promise.all(
                pets.map(pet =>
                    api.get(`/api/pets/${pet.petId}/symptoms?from=${from}&to=${to}`).catch(() => [])
                )
            );

            const avatarColors = {
                'dog':    'bg-amber-100 text-amber-700',
                'cat':    'bg-violet-100 text-violet-700',
                'bird':   'bg-sky-100 text-sky-700',
                'rabbit': 'bg-pink-100 text-pink-700'
            };

            pets.forEach((pet, i) => {
                const symptoms = weekSymptoms[i];
                const count = symptoms.length;
                const avgSev = count > 0
                    ? symptoms.reduce((s, x) => s + x.severity, 0) / count
                    : null;

                const age = pet.dateOfBirth ? calculateAge(pet.dateOfBirth) : null;
                const initial = pet.name.charAt(0).toUpperCase();
                const avatarColor = avatarColors[pet.species.toLowerCase()] || 'bg-teal-100 text-teal-700';

                const countBadge = count === 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : count <= 3
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700';

                const countLabel = count === 0
                    ? 'No symptoms this week'
                    : `${count} symptom${count !== 1 ? 's' : ''} this week`;

                const severityBadge = avgSev !== null
                    ? `<span class="${severityColor(Math.round(avgSev))} px-2.5 py-1 rounded-full text-xs font-semibold">
                           avg severity ${avgSev.toFixed(1)}
                       </span>`
                    : '';

                const card = document.createElement('a');
                card.href = `/pet-detail.html?petId=${pet.petId}`;
                card.className = 'bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md hover:border-teal-200 transition-all block group';
                card.innerHTML = `
                    <div class="flex items-start space-x-4">
                        <div class="flex-shrink-0 w-12 h-12 rounded-2xl ${avatarColor} flex items-center justify-center text-lg font-bold">
                            ${initial}
                        </div>
                        <div class="flex-grow min-w-0">
                            <h3 class="text-base font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">${pet.name}</h3>
                            <p class="text-sm text-slate-500">${pet.species}${pet.breed ? ' &middot; ' + pet.breed : ''}</p>
                            ${age !== null ? `<p class="text-xs text-slate-400 mt-0.5">${age}</p>` : ''}
                        </div>
                        <svg class="w-5 h-5 text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </div>
                    <div class="mt-4 pt-4 border-t border-slate-100 flex items-center flex-wrap gap-2">
                        <span class="${countBadge} px-2.5 py-1 rounded-full text-xs font-semibold">${countLabel}</span>
                        ${severityBadge}
                    </div>
                `;
                petList.appendChild(card);
            });
        } catch (err) {
            showError('Failed to load pets: ' + err.message);
        }
    }

    function calculateAge(dobStr) {
        const dob = new Date(dobStr);
        const now = new Date();
        let years = now.getFullYear() - dob.getFullYear();
        let months = now.getMonth() - dob.getMonth();
        if (months < 0) { years--; months += 12; }
        if (years > 0) return `${years} year${years !== 1 ? 's' : ''} old`;
        return `${months} month${months !== 1 ? 's' : ''} old`;
    }

    loadPets();
});
