/* eslint-disable indent */
const axios = require('axios');

const client = axios.create({
	baseURL: 'https://api.musixmatch.com/ws/1.1/',
});

class Musixmatch {
	getTrack(q_track, q_artist) {
		return client.get('/track.search', {
			params: {
				apikey: process.env.MUSIXMATCH,
				q_track,
				q_artist,
			},
		}).then(res => {
			const track = res.data.message.body.track_list[0].track;
			return {
				id: track.track_id,
				status: (track.has_lyrics) ? true : false,
			};
		}).catch(err => {
			console.error(err);
		});
	}

	getSnippet(track_id) {
		return client.get('/track.snippet.get', {
				params: {
					apikey: process.env.MUSIXMATCH,
					track_id
				},
			})
			.then(res => {
				return {
					text: res.data.message.body.snippet.snippet_body,
					lang: res.data.message.body.snippet.snippet_language
				};
			})
			.catch(err => {
				console.error(err);
			});
	}
}

module.exports = new Musixmatch();
