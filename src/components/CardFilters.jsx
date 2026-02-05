import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { CardService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { CLASSES, TALENTS } from '../data/constants';
import CustomSelect from './common/CustomSelect';
import CardAutocomplete from './common/CardAutocomplete'; // Import Autocomplete
import '../styles/CardFilters.css';

/**
 * Componente de filtros para cartas
 * @param {Object} props
 * @param {Object} props.filters - Filtros actuales {pitch, costo, search}
 * @param {Function} props.onFilterChange - Callback al cambiar filtros
 * @param {boolean} props.isLoading - Indica si se están cargando datos
 */
const CardFilters = ({ filters, onFilterChange, isLoading = false, includeWhiteBorder = true }) => {
    // console.log('Current Filters:', filters); // Reduce noise
    const { t } = useLanguage();
    // Estado local para el input de búsqueda
    const [localSearch, setLocalSearch] = useState(filters.search || '');
    const [availableSets, setAvailableSets] = useState([]);
    const [availableClasses, setAvailableClasses] = useState([]);

    // Cargar sets disponibles al montar (Classes & Talents are now static)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const setsResponse = await CardService.getSets();
                setAvailableSets(setsResponse.data || []);
            } catch (error) {
                console.error('Error loading metadata:', error);
            }
        };
        fetchData();
    }, []);

    // Sincronizar estado local si los filtros cambian externamente
    useEffect(() => {
        if (filters.search !== undefined && filters.search !== localSearch) {
            setLocalSearch(filters.search || '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.search]);

    const handleSearchChange = (e) => {
        setLocalSearch(e.target.value);
    };

    const handleSearchCheck = (e) => {
        // Ejecutar búsqueda al presionar Enter
        if (e.key === 'Enter') {
            onFilterChange({ ...filters, search: localSearch });
        }
    };

    // También permitir búsqueda al perder el foco (opcional, pero buena UX)
    const handleSearchBlur = () => {
        if (localSearch !== filters.search) {
            onFilterChange({ ...filters, search: localSearch });
        }
    };

    // --- Helpers for CustomSelect adapters ---

    // Pitch Options
    const pitchOptions = [
        { value: '', label: t('filters.any_color') },
        { value: '1', label: t('filters.pitch_red') },
        { value: '2', label: t('filters.pitch_yellow') },
        { value: '3', label: t('filters.pitch_blue') }
    ];

    // Cost Options
    const costOptions = [
        { value: '', label: t('filters.any_cost') },
        { value: '0', label: '0' },
        { value: '1', label: '1' },
        { value: '2', label: '2' },
        { value: '3', label: '3' },
        { value: '4', label: '4' },
        { value: '5', label: '5' },
        { value: '6+', label: '6+' }, // Note: Backend needs to handle this or exact match
        { value: 'X', label: 'X' }
    ];


    // Class Options (Static)
    const classOptions = [
        { value: '', label: t('filters.all_classes') },
        ...CLASSES.map(cls => ({ value: cls, label: cls }))
    ];

    // Talent Options (Static)
    const talentOptions = [
        { value: '', label: t('filters.all_talents') || 'All Talents' },
        ...TALENTS.map(tal => ({ value: tal, label: tal }))
    ];

    // Set Options
    const setOptions = [
        { value: '', label: t('filters.any_set') },
        ...availableSets.map(s => ({ value: s, label: s }))
    ];


    // Handlers modified for CustomSelect (value passed directly)
    const handlePitchChange = (val) => {
        if (val === undefined) return;

        // Single select logic for now based on current UI, can extend to multi if needed
        // Assuming current logic replaces or adds? The original code did "includes check".
        // Let's stick to simple "replace" or "toggle" if CustomSelect doesn't support multiple yet.
        // But original generic <select> only supports single value selection unless multiple is set. 
        // The original code: if (!current.includes(val)) ... set: [...current, val]
        // This implies the original intent was MULTI-select via repeated single selections? 
        // OR it was just weird logic for a single select.
        // A standard <select> without 'multiple' only sends one value.
        // So I will implement single selection for now.

        // Update: The original code appended to an array: `onFilterChange({ ...filters, pitch: [...current, val] });`
        // This means the user could select "Red" then select "Blue" and have both.
        // BUT the UI (<select>) would only show one selected option. This is "bad" UX for a single <select>.
        // Usually you want a MultiSelect or just Single Select.
        // I will implement SINGLE SELECT for now, as that makes the most sense for a dropdown replacement.
        // If the user wants multi-select, we should use tags (which are already there).
        // Let's stick to single value change that *adds* to filters if strictly needed, or just sets it.
        // WAIT: The original code ADDS it. "pitch: [...current, val]".
        // So I should keep that behavior: selecting an option ADDS it to the active filters list.

        const current = Array.isArray(filters.pitch) ? filters.pitch : (filters.pitch ? [filters.pitch] : []);
        if (!current.includes(val) && val !== '') {
            onFilterChange({ ...filters, pitch: [...current, val] });
        } else if (val === '') {
            // If clearing via dropdown, maybe we shouldn't clear all? Or just do nothing?
            // Usually "Any" clears the filter.
            onFilterChange({ ...filters, pitch: [] }); // Clear all pitch filters
        }
    };

    const handleCostoChange = (val) => {
        if (val === undefined) return;
        const current = Array.isArray(filters.costo) ? filters.costo : (filters.costo ? [filters.costo] : []);
        if (!current.includes(val) && val !== '') {
            onFilterChange({ ...filters, costo: [...current, val] });
        } else if (val === '') {
            onFilterChange({ ...filters, costo: [] });
        }
    };

    const handleSetChange = (val) => {
        if (val === undefined) return;
        const current = Array.isArray(filters.set) ? filters.set : (filters.set ? [filters.set] : []);
        if (!current.includes(val) && val !== '') {
            onFilterChange({ ...filters, set: [...current, val] });
        } else if (val === '') {
            onFilterChange({ ...filters, set: [] });
        }
    };

    const handleClassChange = (val) => {
        if (val === undefined) return;
        const current = Array.isArray(filters.clase) ? filters.clase : (filters.clase ? [filters.clase] : []);
        if (!current.includes(val) && val !== '') {
            onFilterChange({ ...filters, clase: [...current, val] });
        } else if (val === '') {
            onFilterChange({ ...filters, clase: [] });
        }
    };

    const handleTalentChange = (val) => {
        if (val === undefined) return;
        const current = Array.isArray(filters.talento) ? filters.talento : (filters.talento ? [filters.talento] : []);
        if (!current.includes(val) && val !== '') {
            onFilterChange({ ...filters, talento: [...current, val] });
        } else if (val === '') {
            onFilterChange({ ...filters, talento: [] });
        }
    };

    const handleClearFilters = () => {
        setLocalSearch(''); // Limpiar estado local también
        onFilterChange({ pitch: '', costo: '', search: '', set: '', clase: '', talento: '' });
    };

    const handleRemoveFilter = (key, valueToRemove) => {
        if (key === 'search') {
            setLocalSearch('');
            onFilterChange({ ...filters, search: '' });
            return;
        }

        const current = filters[key];
        if (Array.isArray(current)) {
            const updated = current.filter(v => v !== valueToRemove);
            onFilterChange({ ...filters, [key]: updated.length > 0 ? (updated.length === 1 ? updated[0] : updated) : '' });
        } else {
            onFilterChange({ ...filters, [key]: '' });
        }
    };

    const hasActiveFilters = filters.pitch || filters.costo || filters.search || filters.set || filters.clase || filters.talento;

    return (
        <div className="card-filters">
            <div className="card-filters__controls">
                <div className="card-filters__search">
                    <CardAutocomplete
                        value={localSearch}
                        onChange={(val) => setLocalSearch(val)}
                        onSearch={(val) => onFilterChange({ ...filters, search: val })}
                        disabled={isLoading}
                        includeWhiteBorder={includeWhiteBorder}
                    />
                </div>

                <div className="filter-select-wrapper">
                    <CustomSelect
                        options={classOptions}
                        value=""
                        placeholder={t('filters.all_classes')}
                        onChange={handleClassChange}
                        disabled={isLoading}
                    />
                </div>

                <div className="filter-select-wrapper">
                    <CustomSelect
                        options={talentOptions}
                        value=""
                        placeholder={t('filters.all_talents') || "Talents"}
                        onChange={handleTalentChange}
                        disabled={isLoading}
                    />
                </div>

                <div className="filter-select-wrapper">
                    <CustomSelect
                        options={pitchOptions}
                        value=""
                        placeholder={t('filters.any_color')}
                        onChange={handlePitchChange}
                        disabled={isLoading}
                    />
                </div>

                <div className="filter-select-wrapper">
                    <CustomSelect
                        options={costOptions}
                        value=""
                        placeholder={t('filters.any_cost')}
                        onChange={handleCostoChange}
                        disabled={isLoading}
                    />
                </div>

                <div className="filter-select-wrapper">
                    <CustomSelect
                        options={setOptions}
                        value=""
                        placeholder={t('filters.any_set')}
                        onChange={handleSetChange}
                        disabled={isLoading}
                    />
                </div>
            </div>

            {hasActiveFilters && (
                <div className="card-filters__active-section">
                    <div className="card-filters__tags">
                        {Object.entries(filters).map(([key, value]) => {
                            if (!value || (Array.isArray(value) && value.length === 0)) return null;

                            const values = Array.isArray(value) ? value : [value];

                            return values.map((val, idx) => {
                                let label = val;
                                if (key === 'pitch') {
                                    if (String(val) === '1') label = t('filters.label_pitch_red');
                                    else if (String(val) === '2') label = t('filters.label_pitch_yellow');
                                    else if (String(val) === '3') label = t('filters.label_pitch_blue');
                                } else if (key === 'costo') {
                                    label = `${t('filters.label_cost')}: ${val}`;
                                } else if (key === 'search') {
                                    label = `${t('filters.label_search')}: "${val}"`;
                                } else if (key === 'set') {
                                    label = `${t('filters.label_set')}: ${val}`;
                                } else if (key === 'clase') {
                                    label = `${t('filters.label_class')}: ${val}`;
                                } else if (key === 'talento') {
                                    label = `${t('filters.label_talent') || 'Talent'}: ${val}`;
                                }

                                return (
                                    <span key={`${key}-${val}-${idx}`} className="card-filters__tag">
                                        {label}
                                        <button
                                            onClick={() => handleRemoveFilter(key, val)}
                                            className="card-filters__tag-remove"
                                            aria-label={`${t('recent.clear')} ${label}`}
                                        >
                                            ×
                                        </button>
                                    </span>
                                );
                            });
                        })}
                    </div>
                    <button
                        className="card-filters__clear"
                        onClick={handleClearFilters}
                        disabled={isLoading}
                    >
                        {t('filters.clear_all')}
                    </button>
                </div>
            )
            }
        </div >
    );
};

export default CardFilters;
