package my.projects.mygames.controller;

import my.projects.mygames.model.Game;
import my.projects.mygames.repository.GameRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/games")
@CrossOrigin(origins = "*")
public class GameController {

    @Autowired
    private GameRepository gameRepository;

    @GetMapping
    public List<Game> getAllGames() {

        return gameRepository.findAll();

    }

    @PostMapping
    public ResponseEntity<Game> createGame(@RequestBody Game game) {
        if (game.getScore() < 0 || game.getScore() > 100) {
            return ResponseEntity.badRequest().build();
        }
        // Si lo guardás como Terminado o Platinado y no mandaste fecha, pone la de hoy
        if (("Terminado".equals(game.getStatus()) || "Platinado".equals(game.getStatus()))
                && game.getDateCompleted() == null) {
            game.setDateCompleted(LocalDate.now());
        }
        Game savedGame = gameRepository.save(game);
        return ResponseEntity.ok(savedGame);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGame(@PathVariable Long id) {
        if (!gameRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        gameRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

}
