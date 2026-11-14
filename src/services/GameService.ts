import type { Game } from '../types/Game';

const API_URL = 'http://localhost:8080/api/games';

export const getGames = async (): Promise<Game[]> => {

    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error al obtener los juegos');
    return response.json();

}

export const createGame = async (game: Omit<Game, 'id'>): Promise<Game> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(game),
    });
    if (!response.ok) throw new Error('Error al guardar el juego');
    return response.json();
};

export const deleteGame = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar el juego');
};