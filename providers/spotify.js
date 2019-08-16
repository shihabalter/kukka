const axios = require('axios');
const qs = require('querystring');

const client = axios.create({
	baseURL: 'https://api.spotify.com/v1',
});

class Spotify {
	async init(country) {
		this.country = country.toUpperCase();

		return axios
			.post('https://accounts.spotify.com/api/token',
				qs.stringify({
					grant_type: 'client_credentials'
				}), {
					headers: {
						'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_ID}:${process.env.SPOTIFY_SECRET}`).toString('base64')}`
					}
				})
			.then(response => {
				client.defaults.headers.get['Authorization'] = `Bearer ${response.data.access_token}`;
			})
			.catch(console.error);
	}

	getPlaylists() {
		return client.get('/browse/featured-playlists', {
			params: {
				country: this.country,
			},
		}).then(res => {
			const {
				items: playlists
			} = res.data.playlists;
			return playlists.map(list => {
				return {
					name: list.name,
					id: list.id,
				};
			});
		}).catch(err => {
			console.error(err);
		});
	}

	getPlaylistTracks(id) {
		return client.get(`/playlists/${id}/tracks`, {
			params: {
				market: this.country,
				fields: 'items(track(name,popularity,artists,album(name)))'
			},
		}).then(res => {
			const tracks = res.data.items.map(track => {
				return {
					name: track.track.name,
					artists: track.track.artists.map(artist => artist.name),
					album: track.track.album.name,
					popularity: track.track.popularity
				};
			});
			return tracks;
		}).catch(err => {
			console.error(err);
		});
	}
}

module.exports = new Spotify();
