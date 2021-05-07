const vec3 = require('vec3');

exports.pineapple = (tags)=>{
	return({
		size: vec3(20, 13, 20),
		get: (x, y, z, self)=>{
			let dis = Math.floor(Math.hypot(x, z, y/2));

			if (dis == 4) return 'red_sandstone';
			else if (Math.abs(x) == y-9 && Math.abs(z) == y-9) return ['lime_wool', 'green_wool'];
		},
	});
};

exports.cake = (tags)=>{
	return({
		size: vec3(16, 6, 16),
		diorite: new Array(16).fill('polished_diorite'),
		get: (x, y, z, self)=>{
			if (y == 5) return ['redstone_block', ...self.diorite];
			if (y == 4) return ['polished_diorite', 'polished_granite'];
			else return 'polished_granite';
		},
	});
};
