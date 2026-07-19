let enderCoordsElement = () => document.getElementById("ender-coords")
let enderCoordTemplateElement = () => document.getElementById("ender-coord-template")

function addEnderCoordElement() {
    enderCoordsElement().appendChild(enderCoordTemplateElement().content.cloneNode(true))
}

class EnderCoord {
    /**
     * @param {Number} x
     * @param {Number} z
     * @param {Number} yaw
     */
    constructor(x, z, yaw) {
        this.x = x
        this.z = z
        this.yaw = yaw
    }
}

/**
 * @param {Number} x
 * @param {Number} z
 * @param {String} errorMessage
 */
class CalcResult {
    constructor(x, z, errorMessage) {
        this.x = x
        this.z = z
        this.errorMessage = errorMessage
    }
}

/**
 * @returns {EnderCoord[]}
 */
function getEnderCoords() {
    let enderCoords = []
    for (let element of enderCoordsElement().getElementsByClassName("ender-coord")) {
        enderCoords.push(element)
    }

    return enderCoords
        .map(element => {
            let x = element.getElementsByClassName("ender-coord-x")[0].value
            let z = element.getElementsByClassName("ender-coord-z")[0].value
            let yaw = element.getElementsByClassName("ender-coord-yaw")[0].value

            if (x === "" || z === "" || yaw === "") {
                return null
            }

            x = Number(x)
            z = Number(z)
            yaw = Number(yaw)

            if (isNaN(x) || isNaN(z) || isNaN(yaw)) {
                return null
            }

            return new EnderCoord(x, z, yaw)
        })
        .filter(enderCoord => enderCoord != null)
}

/**
 * @param {EnderCoord} coord0
 * @param {EnderCoord} coord1
 * @returns {CalcResult}
 */
function calculateStrongholdCoords(coord0, coord1) {
    /*
     * Stronghold coordinates, where d# is the distance to the stronghold:
     *    x = x0 - d0 * sin(yaw0) = x1 - d1 * sin(yaw1)
     *    z = z0 + d0 * cos(yaw0) = z1 + d1 * cos(yaw1)
     *
     * Solve for d1 in terms of d0:
     *    x0 - d0 * sin(yaw0) = x1 - d1 * sin(yaw1)
     * => d1 * sin(yaw1) = x1 - x0 + d0 * sin(yaw0)
     * => d1 = (x1 - x0 + d0 * sin(yaw0)) / sin(yaw1)
     * => d1 = (d0 * sin(yaw0) + (x1 - x0)) / sin(yaw1)
     *
     *    z0 + d0 * cos(yaw0) = z1 + d1 * cos(yaw1)
     * => -d1 * cos(yaw1) = z1 - z0 - d0 * cos(yaw0)
     * => d1 = (z1 - z0 - d0 * cos(yaw0)) / -cos(yaw1)
     * => d1 = (d0 * cos(yaw0) - (z1 - z0)) / cos(yaw1)
     *
     * Solve for d0:
     *    d1 = (d0 * sin(yaw0) + (x1 - x0)) / sin(yaw1), d1 = (d0 * cos(yaw0) - (z1 - z0)) / cos(yaw1)
     * => (d0 * sin(yaw0) + (x1 - x0)) / sin(yaw1) = (d0 * cos(yaw0) - (z1 - z0)) / cos(yaw1)
     * => d0 * sin(yaw0) + (x1 - x0) = (d0 * cos(yaw0) - (z1 - z0)) * sin(yaw1) / cos(yaw1)
     * => d0 * sin(yaw0) + (x1 - x0) = (d0 * cos(yaw0) - (z1 - z0)) * tan(yaw1)
     * => d0 * sin(yaw0) + (x1 - x0) = d0 * cos(yaw0) * tan(yaw1) - (z1 - z0) * tan(yaw1)
     * => d0 * sin(yaw0) - d0 * cos(yaw0) * tan(yaw1) = -(x1 - x0) - (z1 - z0) * tan(yaw1)
     * => d0 * (sin(yaw0) - cos(yaw0) * tan(yaw1)) = -((x1 - x0) + (z1 - z0) * tan(yaw1))
     * => d0 = -((x1 - x0) + (z1 - z0) * tan(yaw1)) / (sin(yaw0) - cos(yaw0) * tan(yaw1))
     * => d0 = ((x1 - x0) + (z1 - z0) * tan(yaw1)) / (cos(yaw0) * tan(yaw1) - sin(yaw0))
     */
    let x0 = coord0.x
    let x1 = coord1.x
    let z0 = coord0.z
    let z1 = coord1.z
    let yaw0 = coord0.yaw / 180 * Math.PI
    let yaw1 = coord1.yaw / 180 * Math.PI
    let d0 = ((x1 - x0) + (z1 - z0) * Math.tan(yaw1)) / (Math.cos(yaw0) * Math.tan(yaw1) - Math.sin(yaw0))
    let d1 = (d0 * Math.cos(yaw0) - (z1 - z0)) / Math.cos(yaw1)
    let x = x0 - d0 * Math.sin(yaw0)
    let z = z0 + d0 * Math.cos(yaw0)

    if (x0 === x1 && z0 === z1) {
        return new CalcResult(null, null, "Eyes of Ender were thrown from the same position")
    } else if (isNaN(d0)) {
        return new CalcResult(null, null, "Eyes of Ender are inline with each other")
    } else if (d0 < 0 || d1 < 0) {
        return new CalcResult(null, null, "Eyes of Ender are pointing towards different strongholds")
    } else {
        return new CalcResult(x, z, null)
    }
}

function calculate() {
    let enderCoords = getEnderCoords()
    let x = ""
    let z = ""

    if (enderCoords.length >= 2) {
        let coords = calculateStrongholdCoords(enderCoords[0], enderCoords[1])
        if (coords.errorMessage == null) {
            x = Math.round(coords.x)
            z = Math.round(coords.z)
        } else {
            x = ""
            z = ""
            window.alert(coords.errorMessage)
        }
    } else {
        window.alert("Missing Eye of Ender coordinates")
    }

    document.getElementById("stronghold-coord-x").value = x
    document.getElementById("stronghold-coord-z").value = z

    document.getElementById("stronghold-coord-x-end").value = Math.round(x / 8)
    document.getElementById("stronghold-coord-z-end").value = Math.round(z / 8)
}
