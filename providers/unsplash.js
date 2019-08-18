const axios = require('axios');
const fs = require('fs');

const client = axios.create({
	baseURL: 'https://api.unsplash.com',
	headers: {
		'Accept-Version': 'v1',
		'Authorization': `Client-ID ${process.env.UNSPLASH}`
	}
});

class Unsplash {
	getImage(query, options) {
		return client.get('/photos/random.search', {
			params: {
				query,
				orientation: options.orientation || 'squarish',
			},
		}).then(res => {
			const data = {
				id: res.data.id,
				resolution: (res.data.width > res.data.height) ? ((res.data.height > 1080) ? 1080 : res.data.height) : ((res.data.width > 1080) ? 1080 : res.data.width),
				desc: res.data.alt_description,
				color: res.data.color,
				image: res.data.urls.raw,
				url: res.data.links.html,
				artist: {
					id: res.data.user.id,
					username: res.data.user.username,
					name: res.data.user.name,
					twitter: res.data.user.twitter_username,
					instagram: res.data.user.instagram_username,
				}
			};

			if (!fs.existsSync('./images')) {
				fs.mkdirSync('./images');
			}

			return axios({
				url: data.image,
				responseType: 'stream',
				params: {
					q: options.quality || 80,
					fm: options.file || 'jpg',
					crop: options.crop || 'edges',
					fit: options.fit || 'crop',
					ar: options.ar || '1:1',
					w: data.resolution,
					h: data.resolution,
				}
			}).then(res => {
				return new Promise((resolve, reject) => {
					res.data
						.pipe(fs.createWriteStream(`./images/${data.id}.${options.file}`))
						.on('finish', () => resolve(data))
						.on('error', err => reject(err));
				});
			});
		}).catch(err => {
			console.error(err);
		});
	}
}

module.exports = new Unsplash();
