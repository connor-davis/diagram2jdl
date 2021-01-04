let fs = require("fs");
let path = require("path");

let entities = {};
let enums = {};
let relationships = {};

let isEntity = false;
let isEnum = false;
let isRelationShip = false;

let currentEntity = "";

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

            let fields = [...matches];

            fields.forEach((field) => {
                if (field.startsWith("entity")) {
                    isEntity = true;
                    isEnum = false;
                    isRelationShip = false;

                    let args = field.split(" ");

                    currentEntity = args[1];

                    entities[args[1]] = {
                        type: args[0],
                        name: args[1],
                        childFields: []
                    };
                } else if (field.startsWith("enum")) {
                    isEntity = false;
                    isEnum = true;
                    isRelationShip = false;

                    let args = field.split(" ");

                    enums[args[1]] = {
                        type: args[0],
                        name: args[1],
                        childEnums: []
                    };
                } else if (field.startsWith("relationship")) {
                    isEntity = false;
                    isEnum = false;
                    isRelationShip = true;

                    let args = field.split(" ");

                    currentEntity = args[1];

                    relationships[args[1]] = {
                        type: args[0],
                        parent: args[1],
                        name: args[2],
                        childRelationships: []
                    };
                } else if (field.startsWith("field")) {
                    if (isEntity) {
                        let args = field.split(" ");

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

                    } else if (isRelationShip) {
                        let args = field.split(" ");

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
                dataWrite += `
${entities[entity].type} ${entities[entity].name} {
    ${entities[entity].childFields.map((field, index) => { return index === 0 ? `${field.name} ${field.type}` : `\n    ${field.name} ${field.type}` })}
}
                `;
            }

            fs.writeFileSync(path.join(__dirname, "output", "Test.jdl"), dataWrite, { encoding: 'utf8', flag: 'w' })
        });
    });
})();