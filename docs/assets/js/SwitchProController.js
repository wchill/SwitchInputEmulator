import {BaseController, StandardMappings} from "./BaseController.js";

let SwitchProControllerBase = {
    mixins: [BaseController],
    data: function() {
        return {
            canonicalName: 'Switch Pro Controller'
        };
    }
};

export let SwitchProControllerStandard = {
    mixins: [SwitchProControllerBase, StandardMappings]
};

export let SwitchProControllerMacFirefox = {
    mixins: [SwitchProControllerBase, StandardMappings]
};