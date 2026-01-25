const { parseDecklist } = require('./fab-tcg-web/src/utils/deckParser');

const text = `Name: Vengeance
Hero: Ira, Scarlet Revenger
Format: Classic Constructed

Arena cards
1x Edge of Autumn
1x Mask of Momentum
1x Nullrune Hood
1x Okana Scar Wraps
1x Pouncing Paws
1x Robe of Autumn's Fall
1x Tide Flippers

Deck cards
3x Bittering Thorns (red)
3x Censor (red)
3x Enact Vengeance (red)
3x Erase Face (red)
3x Fate Foreseen (red)
3x Flic Flak (red)
3x Flying Kick (red)
3x Scar for a Scar (red)
3x Seek Vengeance (red)
3x Sigil of Solace (red)
3x Sink Below (red)
3x Sirens of Safe Harbor (red)
3x Torrent of Tempo (red)
3x Wreck Havoc (red)
3x Bittering Thorns (blue)
3x Legacy of Ikaru (blue)
3x Lunging Press (blue)
3x Nip at the Heels (blue)
3x Seek Vengeance (blue)
3x Torrent of Tempo (blue)
3x Vengeance Never Rests (blue)`;

console.log(JSON.stringify(parseDecklist(text), null, 2));
