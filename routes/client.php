<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\mcsimpleplayerlisting;

Route::get('/servers/{server}/players', [mcsimpleplayerlisting\PlayersController::class, 'players']);
