require('dotenv').config();
const fs = require('fs');
const spotify = require('./providers/spotify');
const mxm = require('./providers/musixmatch');
const unsplash = require('./providers/unsplash');
const translator = require('translate-json-object')();
translator.init({
	yandexApiKey: process.env.TRANSLATOR
});

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
	if (lyrics.snippet.lang !== 'en') {
		lyrics.snippet.translated = await translator.translate(lyrics.snippet, 'en');
	}

	const imageOptions = {
		orientation: 'squarish',
		file: 'jpg',
		quality: 80,
		crop: 'edges',
		fit: 'crop',
	};
	const imageData = await unsplash.getImage(lyrics.snippet.translated || lyrics.snippet.text, imageOptions);

	/* WORK IN PROGRESS */
})();
