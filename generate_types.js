const fs = require('fs');

const { compile, compileFromFile } = require('json-schema-to-typescript')

const importFolder = './signpost/schema';
const exportFolder = './webapp/src/types';

const replaceExtension=(file)=>{
    return file.replace('json','ts')
}

fs.readdir(importFolder, (err, files) => {
    console.log(files)
    files.forEach((file) => {
        // compile from file
        compileFromFile(importFolder + '/' + file)
            .then(ts => fs.writeFileSync(exportFolder + '/' + replaceExtension(file), ts))

    })

})