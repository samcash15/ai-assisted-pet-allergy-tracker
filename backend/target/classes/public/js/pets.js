document.addEventListener('DOMContentLoaded', async () => {
    const petList = document.getElementById('pet-list');
    const noPets = document.getElementById('no-pets');
    const modal = document.getElementById('add-pet-modal');
    const form = document.getElementById('add-pet-form');

    document.getElementById('btn-add-pet').addEventListener('click', () => modal.classList.remove('hidden'));
    document.getElementById('btn-cancel-pet').addEventListener('click', () => modal.classList.add('hidden'));
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

            const avatarColors = {
                'dog': 'bg-amber-100 text-amber-700',
                'cat': 'bg-violet-100 text-violet-700',
                'bird': 'bg-sky-100 text-sky-700',
                'rabbit': 'bg-pink-100 text-pink-700'
            };

            pets.forEach(pet => {
                const age = pet.dateOfBirth ? calculateAge(pet.dateOfBirth) : null;
                const initial = pet.name.charAt(0).toUpperCase();
                const avatarColor = avatarColors[pet.species.toLowerCase()] || 'bg-teal-100 text-teal-700';

                const card = document.createElement('a');
                card.href = `/pet-detail.html?petId=${pet.petId}`;
                card.className = 'bg-white rounded-xl shadow-sm border border-stone-200 p-5 hover:shadow-md hover:border-teal-300 transition-all block group';
                card.innerHTML = `
                    <div class="flex items-start space-x-4">
                        <div class="flex-shrink-0 w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-lg font-bold">
                            ${initial}
                        </div>
                        <div class="flex-grow min-w-0">
                            <h3 class="text-lg font-semibold text-stone-800 group-hover:text-teal-700 transition-colors">${pet.name}</h3>
                            <p class="text-sm text-stone-500">${pet.species}${pet.breed ? ' &middot; ' + pet.breed : ''}</p>
                            ${age !== null ? `<p class="text-xs text-stone-400 mt-0.5">${age}</p>` : ''}
                        </div>
                        <svg class="w-5 h-5 text-stone-300 group-hover:text-teal-500 transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
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
