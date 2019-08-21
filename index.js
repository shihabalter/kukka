/* eslint-disable require-atomic-updates */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Canvas = require('canvas');
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
			return sorted[rand(10)];
		});
}

(async () => {
	await spotify.init('TR');

	let song;
	let lyric = {
		status: false
	};

	while (!lyric.status) {
		song = await getRandomSong();
		lyric = await mxm.getTrack(song.name, song.artists[0]);
	}

	// remove unnecessary parts from the song name
	song.name = song.name.split('-')[0];

	lyric.snippet = await mxm.getSnippet(lyric.id);
	if (lyric.snippet.lang !== 'en') {
		lyric.snippet.translated = await translator.translate(lyric.snippet, 'en');
	}

	// remove unnecessary characters from the lyric snippet
	lyric.snippet.text = lyric.snippet.text.replace(/[.,!]*/g, '').toUpperCase();

	const imageOptions = {
		orientation: 'squarish',
		format: 'jpg',
		quality: 80,
		crop: 'edges',
		fit: 'crop',
	};
	const imageData = await unsplash.getImage(lyric.snippet.translated || lyric.snippet.text, imageOptions);

	// filenames in fonts directory should be the family of that font
	// ex. 'Fira Sans' is the font family of 'FiraSans-Regular.ttf'
	// styled fonts (bold, italic, etc.) should be added seperately
	const fontsPath = path.join(__dirname, 'fonts');
	const fonts = fs.readdirSync(fontsPath);
	fonts.forEach(name => {
		Canvas.registerFont(path.join(fontsPath, name), {
			family: name
		});
	});

	const canvas = Canvas.createCanvas(1080, 1080);
	const ctx = canvas.getContext('2d');

	// draw the background image
	ctx.drawImage(await Canvas.loadImage(path.join(__dirname, 'images', `${imageData.id}.${imageOptions.format}`)), 0, 0);

	// draw a black rectangle with some alpha to blackout the background image
	ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
	ctx.fillRect(0, 0, imageData.resolution, imageData.resolution);

	ctx.fillStyle = '#FFF';
	ctx.font = '120px Amatic SC';

	let line = '';
	if (ctx.measureText(lyric.snippet.text).width > 1000) {
		ctx.font = '100px Amatic SC';
		const wordArray = lyric.snippet.text.split(' ');
		wordArray.forEach(word => {
			line += (ctx.measureText(line + word).width > 1000) ? `\n${word} ` : `${word} `;
		});
	}
	ctx.fillText((line.length > 0) ? line : lyric.snippet.text, 80, 216, 1080);

	// add song name
	ctx.font = '55px Fira Sans';
	ctx.fillText(song.name, 80, 895);

	// add song artist
	ctx.font = '35px Fira Sans';
	ctx.fillText(song.artists[0].toUpperCase(), 80, 940);

	// add an eenie meenie tiny watermark
	const bs = 'kukka';
	ctx.font = '25px Fira Sans';
	ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
	ctx.fillText(bs, 1070 - ctx.measureText(bs).width, 1062);

	// write the final product to disk
	canvas.createPNGStream().pipe(fs.createWriteStream(path.join(__dirname, 'images', 'generated.png')));
})();
