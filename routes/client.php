<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\playerlisting;

Route::get('/servers/{server}/players', [playerlisting\PlayersController::class, 'players']);
