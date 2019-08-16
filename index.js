require('dotenv').config();
const spotify = require('./providers/spotify');
const mxm = require('./providers/musixmatch');

const rand = (len) => Math.floor(Math.random() * len);

async function getRandomSong() {
	return await spotify.getPlaylists()
		.then(playlists => spotify.getPlaylistTracks(playlists[rand(playlists.length)].id))
		.then(tracks => {
			const sorted = tracks.sort((a, b) => b.popularity - a.popularity);
			return sorted[0];
		});
}

(async () => {
	await spotify.init('TR');
	let song;
	let lyrics = {
		status: false
	};

	while (!lyrics.status) {
		song = await getRandomSong();
		lyrics = await mxm.getTrack(song.name, song.artists[0]);
	}

	lyrics.snippet = await mxm.getSnippet(lyrics.id);

	/* WORK IN PROGRESS */
})();
