let fs = require("fs");
let path = require("path");

let entities = {};
let enums = {};
let relationships = {};

let isEntity = false;
let isEnum = false;
let isRelationShip = false;

let currentEntity = "";
let currentEnum = "";

(() => {
    let inputFiles = [];

    fs.readdirSync(path.join(__dirname, "input"), { encoding: "utf-8" }).forEach((path, index) => {
        inputFiles.push(path);
    });

    inputFiles.forEach((file) => {
        fs.readFile(path.join(__dirname, "input", file), (error, data) => {
            if (error) return console.log(error);

            let dataString = data.toString("utf-8");
            let regex = /(?<=\%\[).*?(?=\]\%)/gs;
            let matches = dataString.match(regex);

            matches.forEach((match) => {
                if (match.startsWith("entity")) {
                    isEntity = true;
                    isEnum = false;
                    isRelationShip = false;

                    let args = match.split(" ");

                    currentEntity = args[1];

                    entities[args[1]] = {
                        type: args[0],
                        name: args[1],
                        childFields: []
                    };
                } else if (match.startsWith("enum")) {
                    isEntity = false;
                    isEnum = true;
                    isRelationShip = false;

                    let args = match.split(" ");

                    currentEnum = args[1]

                    enums[args[1]] = {
                        type: args[0],
                        name: args[1],
                        childEnums: []
                    };
                } else if (match.startsWith("relationship")) {
                    isEntity = false;
                    isEnum = false;
                    isRelationShip = true;

                    let args = match.split(" ");

                    currentEntity = args[1];

                    relationships[args[1]] = {
                        type: args[0],
                        parent: args[1],
                        name: args[2],
                        childRelationships: []
                    };
                } else if (match.startsWith("field")) {
                    if (isEntity) {
                        let args = match.split(" ");

                        entities[currentEntity].childFields = [...entities[currentEntity].childFields,
                        {
                            type: args[2],
                            name: args[1]
                        }];

                        entities[currentEntity].childFields = entities[currentEntity]
                            .childFields
                            .filter((childField, index, self) =>
                                index === self.findIndex((t) => (
                                    t.type === childField.type
                                    && t.name === childField.name
                                )));
                    } else if (isEnum) {
                        let args = match.split(" ");

                        enums[currentEnum].childEnums = [...enums[currentEnum].childEnums,
                        {
                            type: args[0],
                            name: args[1]
                        }];

                        enums[currentEnum].childEnums = enums[currentEnum]
                            .childEnums
                            .filter((childField, index, self) =>
                                index === self.findIndex((t) => (
                                    t.type === childField.type
                                    && t.name === childField.name
                                )));
                    } else if (isRelationShip) {
                        let args = match.split(" ");

                        if (args[1].startsWith(currentEntity)) {
                            let relationName = args[1].replace(currentEntity + "{", "").replace("}", "");
                            let relationParent = currentEntity;
                            let relationTo = args[3];

                            relationships[currentEntity].childRelationships = [
                                ...relationships[currentEntity].childRelationships,
                                {
                                    relationName,
                                    relationParent,
                                    relationTo
                                }
                            ];

                            relationships[currentEntity].childRelationships = relationships[currentEntity]
                                .childRelationships
                                .filter((childField, index, self) =>
                                    index === self.findIndex((t) => (
                                        t.relationName === childField.relationName
                                        && t.relationParent === childField.relationParent
                                        && t.relationTo === childField.relationTo
                                    )));
                        }
                    }
                }
            });

            let dataWrite = "";

            for (let entity in entities) {
                dataWrite += `${entities[entity].type} ${entities[entity].name} {\n${entities[entity]
                    .childFields
                    .map((field, index) => {
                        return index === 0 ?
                            `${field.name} ${field.type}` :
                            `\n${field.name} ${field.type}`
                    })}\n}\n\n`;
            }

            for (let relationship in relationships) {
                dataWrite += `${relationships[relationship].type} ${relationships[relationship].name} {\n${relationships[relationship]
                    .childRelationships
                    .map((field, index) => {
                        return index === 0 ?
                            `${field.relationParent}{${field.relationName}} to ${field.relationTo}` :
                            `\n${field.relationParent}{${field.relationName}} to ${field.relationTo}`
                    })}\n}\n\n`;
            }

            for (let en in enums) {
                dataWrite += `${enums[en].type} ${enums[en].name} {\n${enums[en]
                    .childEnums
                    .map((field, index) => {
                        return index === 0 ?
                            `${field.name}` :
                            `\n${field.name}`
                    })}\n}\n\n`;
            }

            if (fs.existsSync(path.join(__dirname, "output"))) return fs.writeFileSync(path.join(__dirname, "output", file.split(".")[0] + ".jdl"), dataWrite, { encoding: 'utf8', flag: 'w' });
            else {
                fs.mkdirSync("output");
                return fs.writeFileSync(path.join(__dirname, "output", file.split(".")[0] + ".jdl"), dataWrite, { encoding: 'utf8', flag: 'w' });
            }
        });
    });
})();