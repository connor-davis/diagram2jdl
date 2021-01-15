let fs = require("fs");
let path = require("path");

(() => {
    let inputFiles = [];

    fs.readdirSync(path.join(__dirname, "input"), { encoding: "utf-8" }).forEach((path, index) => {
        inputFiles.push(path);
    });

    inputFiles.forEach((file) => {
        fs.readFile(path.join(__dirname, "input", file), (error, data) => {
            if (error) return console.log(error);

            let dataString = data.toString("utf-8");

            let objectRegex = /(?<=\<object).*?(?=<\/object>)/gs;
            let objects = dataString.match(objectRegex);

            let entities = {};
            let relationships = [];

            objects.forEach((object) => {
                let idRegex = /(?<=id=").*?(?=")/gs;
                let id = object.match(idRegex)[0].trim();

                let labelRegex = /(?<=label=").*?(?=")/gs;
                let label = object.match(labelRegex)[0].trim();

                let typeRegex = /(?<=type=").*?(?=")/gs;
                let type = object.match(typeRegex)[0].trim();

                entities[id] = { label, type };
            });

            let cellRegex = /(?<=\<mxCell).*?(?=\<\/mxCell>)/gs;
            let cells = dataString.match(cellRegex);

            cells = cells.map((cell) => {
                let idRegex = /(?<=id=").*?(?=")/gs;
                let id = cell.match(idRegex) ? cell.match(idRegex)[0].trim() : "";

                let valueRegex = /(?<=value=").*?(?=")/gs;
                let value = cell.match(valueRegex) ? cell.match(valueRegex)[0].trim() : "";

                value = value.split("&#xa;+");
                value = value.filter((val) => val !== "");
                value = value.map((val) => {
                    val = val.replace("+", "");
                    val = val.replace(":", " ");
                    return val;
                });

                let parentRegex = /(?<=parent=").*?(?=")/gs;
                let parent = cell.match(parentRegex)[0].trim();

                let sourceRegex = /(?<=source=").*?(?=")/gs;
                let source = cell.match(sourceRegex) ? cell.match(sourceRegex)[0].trim() : "";

                let targetRegex = /(?<=target=").*?(?=")/gs;
                let target = cell.match(targetRegex) ? cell.match(targetRegex)[0].trim() : "";

                if (parent !== "1" && parent !== "0") entities[parent] = { ...entities[parent], data: value };

                if (source && target) {
                    relationships.push(entities[source].label + " to " + entities[target].label);
                }
            });

            writeJDL({ entities, relationships }, file);
        });
    });
})();

let writeJDL = ({ entities, relationships }, file) => {
    let dataWrite = "";
    let relationshipData = "relationship ManyToMany {\n";

    for (let e in entities) {
        let entity = entities[e];

        dataWrite += `entity ${entity.label} {\n${entity.data.map((data) => {
            return `${data}\n`;
        })}}\n\n`;
    }

    relationships.forEach((relationship) => relationshipData += relationship + "\n");
    relationshipData += "}\n";

    dataWrite += relationshipData;

    if (fs.existsSync(path.join(__dirname, "output"))) return fs
        .writeFileSync(
            path.join(__dirname, "output", file.split(".")[0] + ".jdl"),
            dataWrite,
            { encoding: 'utf8', flag: 'w' }
        );
    else {
        fs.mkdirSync("output");
        return fs
            .writeFileSync(
                path.join(__dirname, "output", file.split(".")[0] + ".jdl"),
                dataWrite,
                { encoding: 'utf8', flag: 'w' }
            );
    }
}