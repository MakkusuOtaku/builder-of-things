const mineflayer = require('mineflayer');
const vec3 = require('vec3');

var mcData;
var Item;
var source;
var origin;
var pointer;
var size;
var dX = 1;
var dZ = 1;

generators = {
	'muchdirt': (tags)=>{
		return({
			size: vec3(8, parseInt(tags[0]), 8),
			get: (x, y, z, self)=>{
				return 'dirt';
			},
		});
	},
	'flaming-rock': (tags)=>{
		return({
			size: vec3(16, 16, 16),
			get: (x, y, z, self)=>{
				if (Math.hypot(x, y-8, z) <= 8) return 'magma_block';
			},
		});
	},
	'mushroom-sphere': (tags)=>{
		return({
			size: vec3(16, 16, 16),
			get: (x, y, z, self)=>{
				if (Math.hypot(x, y-8, z) <= 8) return ['crimson_planks', 'warped_planks'];
			},
		});
	},
};

const bot = mineflayer.createBot({
	host: "localhost",
	username: `BuildMachine`,
	viewDistance: "tiny",
});

bot.on('kicked', (reason, loggedIn) => console.log(reason, loggedIn));
bot.on('error', err => console.log(err));

bot.once('spawn', ()=>{
	mcData = require('minecraft-data')(bot.version);
	Item = require("prismarine-item")(bot.version);
});

bot.on('chat', (username, message)=>{
	if (username == bot.username) return;
	let player = bot.players[username];

	let commands = message.split('>');

	for (command of commands) {
		execute(command);
	}
});

function execute(command) {
	let tokens = command.split(' ');

	switch(tokens[0]) {
		case 'import':
			bot.chat(`Importing generators from ${tokens[1]}`);
			importGenerators(tokens[1]);
			break;
		case 'build':
			if (generators[tokens[1]]) {
				source = generators[tokens[1]](tokens.slice(2));
				origin = bot.entity.position.clone();
				size = source.size;//vec3(8, 8, 8);
				pointer = vec3(0, 0, 0);
				dX = 1;
				dZ = 1;
				generator = source.get;
				buildLoop();
			} else {
				bot.chat(`Could not find generator for ${tokens[1]}`);
			}
			break;
	}
}

function choose(list) {
	return(list[Math.floor(list.length*Math.random())]);
}

function importGenerators(name) {
	let newGenerators = require(`./generators/${name}.js`);
	generators = {...generators, ...newGenerators};
}

function generate() {
	let material = generator(pointer.x-(size.x/2), pointer.y, pointer.z-(size.z/2), source);

	if (!material || typeof material == 'string') return material;
	else return choose(material);
}

async function prepare(blockName) {
	if (bot.heldItem && bot.heldItem.name == blockName) return;

	let equipBlock = bot.inventory.findInventoryItem(blockName);
	if (!equipBlock) {
		await bot.creative.setInventorySlot(36, new Item(mcData.itemsByName[blockName].id, 1));
		equipBlock = bot.inventory.findInventoryItem(blockName);
	}
	await bot.equip(equipBlock, 'hand');
}

async function placeBlock() {
	try {
		let referenceBlock = bot.blockAt(origin.offset(pointer.x-(size.x/2), pointer.y, pointer.z-(size.z/2)));

		bot.placeBlock(referenceBlock, vec3(0, 1, 0), ()=>{});
	} catch(err) {
		console.log(err);
	}
}

async function doTheRoar(target) {
	let result = generate(pointer.x-(size.x/2), pointer.y, pointer.z-(size.z/2));

	if (result) {
		let target = origin.offset(pointer.x, pointer.y, pointer.z);
		target = target.offset(-size.x/2, 1.5, -size.z/2);

		await bot.creative.flyTo(target);
		await prepare(result);
		await placeBlock();
	}
}

async function buildLoop() {

	await doTheRoar();

	pointer.x += dX;
	if (pointer.x == size.x-1 || pointer.x == 0) {
		await doTheRoar();

		dX = -dX;
		pointer.z += dZ;

		if (pointer.z == size.z || pointer.z == -1) {
			dZ = -dZ;
			pointer.z += dZ;
			pointer.y++;
			if (pointer.y == size.y) return;
		}
	}

	setTimeout(buildLoop, 10);
}

function generator(x, y, z) {
	return y < x? 'stone' : null;
}
