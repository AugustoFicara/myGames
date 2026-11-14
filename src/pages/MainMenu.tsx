import { useState, useMemo, useEffect, type FormEvent } from 'react';
import type { Game, GameStatus } from '../types/Game';
import type { RawgGame } from '../types/RawgGame';
import { getGames, createGame, deleteGame } from '../services/GameService';

export default function MainMenu() {
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState<Game>({
        title: '',
        platform: 'PC',
        score: 80,
        status: 'Jugando',
        coverUrl: '',
        review: '',
    });

    // Estados para autocompletado de RAWG
    const [suggestions, setSuggestions] = useState<RawgGame[]>([]);
    const [isSearchingApi, setIsSearchingApi] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [skipNextSearch, setSkipNextSearch] = useState(false);

    // 1. Cargar juegos desde Spring Boot al iniciar
    useEffect(() => {
        const fetchInitialGames = async () => {
            try {
                const data = await getGames();
                setGames(data);
            } catch (error) {
                console.error('Error conectando con el backend:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialGames();
    }, []);

    // 2. Buscador con Debounce en RAWG (3+ letras)
    useEffect(() => {
        if (skipNextSearch) {
            setSkipNextSearch(false);
            return;
        }

        const query = formData.title.trim();
        if (query.length < 3) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearchingApi(true);
            try {
                const apiKey = import.meta.env.VITE_RAWG_API_KEY;
                const response = await fetch(
                    `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=5`
                );
                const data = await response.json();
                setSuggestions(data.results || []);
                setShowDropdown(true);
            } catch (error) {
                console.error('Error buscando en RAWG:', error);
            } finally {
                setIsSearchingApi(false);
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [formData.title]);

    const handleSelectSuggestion = (rawgGame: RawgGame) => {
        setSkipNextSearch(true); // Evita que vuelva a desplegar la lista al autocompletar
        setFormData({
            ...formData,
            title: rawgGame.name,
            coverUrl: rawgGame.background_image || '',
        });
        setShowDropdown(false);
        setSuggestions([]);
    };

    // 3. Guardar juego en la Base de Datos
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const savedGame = await createGame(formData);
            setGames([...games, savedGame]);
            closeModal();
        } catch (error) {
            alert('No se pudo guardar el juego. Verificá que el servidor de Java esté corriendo.');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id?: number) => {
        if (!id || !confirm('¿Eliminar este juego de tu lista?')) return;
        try {
            await deleteGame(id);
            setGames(games.filter(g => g.id !== id));
        } catch (error) {
            console.error('Error al eliminar:', error);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setShowDropdown(false);
        setSuggestions([]);
        setFormData({ title: '', platform: 'PC', score: 80, status: 'Jugando', coverUrl: '', review: '' });
    };

    const stats = useMemo(() => {
        const completed = games.filter(g => g.status === 'Terminado' || g.status === 'Platinado');
        const avg = completed.length > 0
            ? Math.round(completed.reduce((acc, curr) => acc + curr.score, 0) / completed.length)
            : 0;
        return { total: completed.length, avg };
    }, [games]);

    const filteredGames = games.filter(g =>
        g.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getScoreBadgeClass = (score: number) => {
        if (score >= 90) return 'bg-success';
        if (score >= 70) return 'bg-warning text-dark';
        return 'bg-danger';
    };

    return (
        <div className="pb-5">
            {/* NAVBAR */}
            <nav className="navbar navbar-expand-lg border-bottom mb-4" style={{ backgroundColor: '#1a1a1a' }}>
                <div className="container">
                    <span className="navbar-brand fw-bold text-white">
                        MyGames <span className="text-success">2027</span>
                    </span>
                    <div className="d-flex flex-grow-1 mx-lg-4 my-2 my-lg-0">
                        <input
                            type="search"
                            className="form-control rounded-pill"
                            placeholder="Buscar en mi colección..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        className="btn btn-success rounded-pill px-4 fw-bold"
                        onClick={() => setIsModalOpen(true)}
                    >
                        + Agregar Juego
                    </button>
                </div>
            </nav>

            <main className="container">
                {/* DASHBOARD HERO */}
                <div className="row g-3 mb-5">
                    <div className="col-6 col-md-3">
                        <div className="card text-center h-100 border-secondary">
                            <div className="card-body">
                                <h6 className="card-subtitle mb-2 text-muted">Completados</h6>
                                <h2 className="card-title fw-bold mb-0">{stats.total}</h2>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card text-center h-100 border-secondary">
                            <div className="card-body">
                                <h6 className="card-subtitle mb-2 text-muted">Promedio</h6>
                                <h2 className="card-title fw-bold text-success mb-0">{stats.avg} / 100</h2>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card text-center h-100 border-secondary">
                            <div className="card-body">
                                <h6 className="card-subtitle mb-2 text-muted">Platinos</h6>
                                <h2 className="card-title fw-bold text-primary mb-0">
                                    {games.filter(g => g.status === 'Platinado').length}
                                </h2>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card text-center h-100 border-secondary">
                            <div className="card-body">
                                <h6 className="card-subtitle mb-2 text-muted">En curso</h6>
                                <h2 className="card-title fw-bold text-warning mb-0">
                                    {games.filter(g => g.status === 'Jugando').length}
                                </h2>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ESTADO DE CARGA O GRILLA DE JUEGOS */}
                {isLoading ? (
                    <div className="text-center py-5 text-muted">Cargando tu colección...</div>
                ) : filteredGames.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <h5>Todavía no tenés juegos cargados</h5>
                        <p className="small">Hacé clic en "+ Agregar Juego" para registrar el primero del 2027.</p>
                    </div>
                ) : (
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
                        {filteredGames.map(game => {
                            const isPlatinado = game.status === 'Platinado';
                            return (
                                <div className="col" key={game.id}>
                                    <div
                                        className={`card h-100 shadow-sm position-relative ${isPlatinado
                                                ? 'bg-primary bg-gradient text-white border-info'
                                                : 'border-secondary'
                                            }`}
                                        style={{ transition: 'transform 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <button
                                            onClick={() => handleDelete(game.id)}
                                            className="btn btn-sm btn-dark position-absolute top-0 end-0 m-2 opacity-75"
                                            title="Eliminar juego"
                                        >
                                            ×
                                        </button>

                                        <div style={{ height: '250px', backgroundColor: '#2a2a2a', overflow: 'hidden' }}>
                                            {game.coverUrl ? (
                                                <img src={game.coverUrl} alt={game.title} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                                            ) : (
                                                <div className="d-flex h-100 align-items-center justify-content-center text-muted">Sin portada</div>
                                            )}
                                        </div>

                                        <div className="card-body d-flex flex-column">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h5 className="card-title fw-bold mb-0">{game.title}</h5>
                                                {isPlatinado && (
                                                    <span className="badge border border-light text-light bg-primary bg-opacity-25 rounded-pill">
                                                        PLATINO
                                                    </span>
                                                )}
                                            </div>

                                            <div className="d-flex gap-2 mb-3">
                                                <span className="badge bg-secondary">{game.platform}</span>
                                                <span className={`badge ${getScoreBadgeClass(game.score)}`}>
                                                    {game.score}/100
                                                </span>
                                                <span className="badge bg-dark border border-secondary">{game.status}</span>
                                            </div>

                                            {game.review && (
                                                <p className={`card-text small mb-0 flex-grow-1 ${isPlatinado ? 'text-white-50' : 'text-muted'}`}
                                                    style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    "{game.review}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* MODAL DE AGREGAR JUEGO */}
            {isModalOpen && (
                <>
                    <div className="modal-backdrop fade show"></div>
                    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-secondary shadow">
                                <div className="modal-header border-secondary">
                                    <h5 className="modal-title fw-bold">Registrar Juego</h5>
                                    <button type="button" className="btn-close" onClick={closeModal}></button>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body">
                                        <div className="mb-3 position-relative">
                                            <label className="form-label text-muted small d-flex justify-content-between">
                                                <span>Título (escribí 3+ letras para buscar)</span>
                                                {isSearchingApi && <span className="text-success">Buscando...</span>}
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                className="form-control"
                                                placeholder="Ej: Lies of P, Assassin's Creed..."
                                                autoComplete="off"
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                                            />

                                            {showDropdown && suggestions.length > 0 && (
                                                <div
                                                    className="list-group position-absolute w-100 shadow-lg mt-1"
                                                    style={{ zIndex: 1060, maxHeight: '240px', overflowY: 'auto' }}
                                                >
                                                    {suggestions.map((item) => (
                                                        <button
                                                            type="button"
                                                            key={item.id}
                                                            className="list-group-item list-group-item-action d-flex align-items-center gap-3 bg-dark text-light border-secondary"
                                                            onClick={() => handleSelectSuggestion(item)}
                                                        >
                                                            {item.background_image ? (
                                                                <img
                                                                    src={item.background_image}
                                                                    alt={item.name}
                                                                    style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                                                />
                                                            ) : (
                                                                <div
                                                                    className="bg-secondary d-flex align-items-center justify-content-center small"
                                                                    style={{ width: '40px', height: '50px', borderRadius: '4px' }}
                                                                >
                                                                    N/A
                                                                </div>
                                                            )}
                                                            <div className="text-start overflow-hidden">
                                                                <div className="fw-bold text-truncate">{item.name}</div>
                                                                <small className="text-muted">
                                                                    {item.released ? item.released.split('-')[0] : 'Año desconocido'}
                                                                </small>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="row mb-3">
                                            <div className="col">
                                                <label className="form-label text-muted small">Plataforma</label>
                                                <select className="form-select" value={formData.platform} onChange={e => setFormData({ ...formData, platform: e.target.value })}>
                                                    <option>PC</option>
                                                    <option>PS2</option>
                                                    <option>PS5</option>
                                                </select>
                                            </div>
                                            <div className="col">
                                                <label className="form-label text-muted small">Estado</label>
                                                <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as GameStatus })}>
                                                    <option value="Jugando">Jugando</option>
                                                    <option value="Terminado">Terminado</option>
                                                    <option value="Platinado">Platinado</option>
                                                    <option value="Abandonado">Abandonado</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label text-muted small">Puntaje (0 - 100): {formData.score}</label>
                                            <input
                                                type="range" className="form-range" min="0" max="100"
                                                value={formData.score} onChange={e => setFormData({ ...formData, score: parseInt(e.target.value) })}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label text-muted small">URL de Portada</label>
                                            <input
                                                type="url" className="form-control"
                                                value={formData.coverUrl} onChange={e => setFormData({ ...formData, coverUrl: e.target.value })}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label text-muted small">Reseña</label>
                                            <textarea
                                                rows={3} className="form-control"
                                                value={formData.review} onChange={e => setFormData({ ...formData, review: e.target.value })}
                                            ></textarea>
                                        </div>
                                    </div>

                                    <div className="modal-footer border-secondary">
                                        <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>Cancelar</button>
                                        <button type="submit" className="btn btn-success" disabled={isSaving}>
                                            {isSaving ? 'Guardando...' : 'Guardar'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}