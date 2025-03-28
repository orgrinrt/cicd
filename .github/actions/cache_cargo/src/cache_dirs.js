const core = require('@actions/core');
const cache = require('@actions/cache');
const glob = require('@actions/glob');

const fs = require('fs');
const path = require('path'); // Don't forget to import the path module

async function run() {
    try {
        const cachePaths = core.getInput('cache-paths', {required: true}).split(';');
        let keyTemplate = core.getInput('key-template', {required: true});
        const cacheInvalidationPattern = core.getInput('cache-invalidation-pattern', {required: true});

        console.log(`Caching these paths: ${cachePaths}`);
        console.log(`Key Template: ${keyTemplate}`);
        console.log(`Cache Invalidation Pattern: ${cacheInvalidationPattern}`);

        let pathsExist = false;

        for(const currentPath of cachePaths) {
            const absolutePath = path.resolve(currentPath); // Convert to absolute path if necessary
            if(fs.existsSync(absolutePath)){
                pathsExist = true;
                break;
            }
        }

        if(!pathsExist) {
            core.warning(`None of the cache paths exist, skipping caching step. Note that the workflow should adapt to this!`);
            return;
        }
        
        const globber = await glob.create(cacheInvalidationPattern);
        const triggerFiles = await globber.glob();
        const hashObj = require('crypto').createHash('sha1');
        for (const file of triggerFiles) {
            hashObj.update(fs.readFileSync(file));
        }
        console.log(`Trigger files that affect the cache: ${triggerFiles}`);
        const hash = '-' + hashObj.digest('hex');

        // Get all placeholders from the template
        const placeholders = keyTemplate.match(/{(.*?)}/g) || [];

        for (let placeholder of placeholders) {
            const inputName = placeholder.slice(1, -1); // Remove braces
            let value = core.getInput(`key-${inputName}`);
            if (!value && inputName === 'prefix') {
                const osType = require('os').platform();
                value = `${osType}-`;
            }
            keyTemplate = keyTemplate.replace(new RegExp(placeholder, 'g'), value);
        }

        for (const path of cachePaths) {
            const restoreKey = keyTemplate
                .replace('{path}', path.replace(/[^a-z0-9_]/gi, '_')) // Cleaned path
                .replace('{hash}', '');

            console.log(`Restoring cache for path: ${path} with key: ${restoreKey}`);

            const cacheKey = await cache.restoreCache([path], restoreKey, []);

            if (!cacheKey) {
                const saveKey = restoreKey + '-' + hash;
                const createdKey = await cache.saveCache([path], saveKey);
                console.log(`Cache missed. New cache saved with key: ${createdKey}`);
            } else {
                console.log(`Cache hit for key: ${cacheKey}`);
            }
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
