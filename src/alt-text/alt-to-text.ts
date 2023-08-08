import type { AltGoslingSpec, AltTrack } from './alt-gosling-schema';
import { attributeExists, attributeExistsReturn, attributeExistsAndChildHasValue } from './util';

export function addDescriptions(altGoslingSpec: AltGoslingSpec) {
    addTrackPositionDescriptions(altGoslingSpec);
    addTrackAppearanceDescriptions(altGoslingSpec);
    addTrackDataDescriptions(altGoslingSpec);
    addGlobalPositionDescriptions(altGoslingSpec);
    addGlobalDescription(altGoslingSpec);
}


function addTrackPositionDescriptions(altGoslingSpec: AltGoslingSpec) {
    if (altGoslingSpec.composition.nTracks == 1) {
        altGoslingSpec.tracks[0].position.description = 'This is the only track.'
        altGoslingSpec.composition.description = 'There is one (' + altGoslingSpec.tracks[0].appearance.details.layout + ') track.'
    } else if (altGoslingSpec.composition.nTracks == 2) {

        var firstPlace;
        var secondPlace;
        var comb;

        if (altGoslingSpec.tracks[0].appearance.details.layout === 'circular' && altGoslingSpec.tracks[1].appearance.details.layout === 'circular') {
            
            switch(altGoslingSpec.composition.parentValues.arrangement) {
                case 'serial': 
                    firstPlace = 'left half of ring';
                    secondPlace = 'right half of ring';
                    comb = 'Two circular tracks form one ring, with both the half of the ring.'
                    break;
                case 'parallel': 
                    firstPlace = 'outer ring';
                    secondPlace = 'inner ring';
                    comb = 'Two circular tracks form two rings, one around the other.'
                case 'horizontal':
                    firstPlace = 'left';
                    secondPlace = 'right';
                    comb = 'Two circular tracks are shown next to each other.'
                    break;
                default: 
                    firstPlace = 'top';
                    secondPlace = 'bottom';
                    comb = 'Two circular tracks are shown below each other.'
            }
        } else {
            const bothLinear = altGoslingSpec.tracks[0].appearance.details.layout === altGoslingSpec.tracks[1].appearance.details.layout;
            switch(altGoslingSpec.composition.parentValues.arrangement) {
                case 'serial' || 'horizontal': 
                    firstPlace = 'left';
                    secondPlace = 'right';
                    comb = ' are shown next to each other.'
                default: 
                    firstPlace = 'top';
                    secondPlace = 'bottom';
                    comb = 'are shown below each other.'
            }
            if (bothLinear) {
                comb = ''.concat('Two linear tracks ', comb);
            } else {
                comb = ''.concat('One linear and one circular track ', comb);
            }
        }
        altGoslingSpec.tracks[0].position.description = 'This track is shown on the ' + firstPlace;
        altGoslingSpec.tracks[1].position.description = 'This track is shown on the ' + secondPlace;
        altGoslingSpec.composition.description = comb;
        
    } else {
        
    }
}

function addTrackAppearanceDescriptions(altGoslingSpec: AltGoslingSpec) {
    for (const i in altGoslingSpec.tracks) {
        var track = altGoslingSpec.tracks[i];
        addTrackAppearanceDescription(track);
    }
    
}


function addTrackAppearanceDescription(altTrack: AltTrack) {
    //altTrack.description = 'Nu echt iets.'
    const appearanceDet = altTrack.appearance.details;
    var desc = ''


    if (altTrack.type !== 'unknown') {
        trackAppearanceKnownType(altTrack);
    } else {
        trackAppearanceUnknownType(altTrack);
    }



    
}


function trackAppearanceKnownType(altTrack: AltTrack) {
    var desc = ''

    switch(altTrack.type) {
        case 'bar chart': {
    
            var binSize = 1;
            if (attributeExists(altTrack.appearance.details.encodings.encodingStatic, 'size')) {
                var size = attributeExistsReturn(altTrack.appearance.details.encodings.encodingStatic, 'size');
                binSize = size.value;
            } else {
                binSize = 1
            }
            desc = desc.concat('Barchart.') 

            if (altTrack.appearance.details.layout == 'linear') {
                desc = desc.concat(' On the x-axis, the genome is shown. There are vertical bars, with a width of ', (binSize * 256).toString(), ' bp, which height corresponds to the expression on that section of the genome. ')
            } else {
                desc = desc.concat(' On the circular x-axis, the genome is shown. The height of the bars (pointing outwards of the circel), correspond to the expression on that section of the genome. The width of the bars is ', (binSize * 256).toString(), ' bp. ')
            }

        
            //categories
            //if ()

            break;
        }

        case 'line chart': {
            break;
        }

        case 'heat map': {
            break;
        }

        default: {
            // move unknowntype here?
        }

    }

    altTrack.description = desc;
}

function trackAppearanceUnknownType(altTrack: AltTrack) {
    var desc = ''

    desc = desc.concat('Visualization.')

    if (altTrack.title !== 'unknown') {
        //desc = desc.concat(' titled: ' + altTrack.title + '.');
    }

    var appearanceDet = altTrack.appearance.details;
   
    const encodingImportant = ['x', 'y', 'row', 'color']
    let _first = true;
    for (let encoding of encodingImportant) {
        if (attributeExists(appearanceDet.encodings.encodingField, encoding)) {
            let encodingObj = appearanceDet.encodings.encodingField[encoding];
            if (_first) {
                desc = desc.concat(' with ')
                _first = false;
            } else {
                desc = desc.concat(', ')
            }
            desc = desc.concat(encodingObj.type + ' ' + encoding + '-axis')
        }
    }

    if (attributeExistsAndChildHasValue(appearanceDet.encodings.encodingField, 'x', 'type', 'genomic') || (attributeExistsAndChildHasValue(appearanceDet.encodings.encodingField, 'y', 'type', 'genomic'))) {
        desc = desc.concat(',  with ' + appearanceDet.layout + ' genome,')
    }
        

    if (attributeExists(altTrack.data.details.data, 'binSize')) {
        desc = desc.concat(' Data is binned in intervals of ' + altTrack.data.details.data.binSize * 256 + ' bp.');
    }

    
    if (attributeExists(altTrack.data.details.data, 'categories')) {
        if (altTrack.data.details.data.categories.length === 1) {
            //desc = desc.concat(' The only category shown is ' + altTrack.data.details.data.categories[0] + '.');
        } else {
            desc = desc.concat(' The ' + altTrack.data.details.data.categories.length + ' different categories shown are: ' + altTrack.data.details.data.categories.slice(0, -1).join(', ') + ' and ' + altTrack.data.details.data.categories.slice(-1) + '.');
        }
    }

    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
        
    return desc;

}




function addTrackDataDescriptions(altGoslingSpec: AltGoslingSpec) {
    // The genomic range shown is ... The expression value ranges from ... to ... 
    // Tthe max expression is at genomic position
    // the Min expression is at genomic positions (if more than 5, say 'a lot')
    // If categories, there are xx categories
    // Category xxx has the highest expression point
    // Check if same genomic positions for min and for max
}

function addGlobalPositionDescriptions(altGoslingSpec: AltGoslingSpec) {
    if (altGoslingSpec.composition.nTracks == 1) {
        altGoslingSpec.composition.description = 'There is only one track.'
    }

}

function addGlobalDescription(altGoslingSpec: AltGoslingSpec) {

    if (altGoslingSpec.composition.nTracks == 1) {
        altGoslingSpec.longDescription = altGoslingSpec.tracks[0].description;
    }
    
}


// export function altSingleView(altSpec: GoslingSpecAlt) {
    
//     var altText = '';
    
//     var trackSingle = altSpec.structure[0];
//     if (attributeExists(trackSingle, 'specialDesc')) {
//         altText = altText.concat(trackSingle.specialDesc)
//     } else {
//         altText = altText.concat('Visualization')
//     }
//     const encodingImportant = ['x', 'y', 'row', 'color']
//     let _first = true;
//     for (let encoding of encodingImportant) {
//         if (attributeExists(trackSingle.encodingSeparated.encodingField, encoding)) {
//             let encodingObj = trackSingle.encodingSeparated.encodingField[encoding];
//             if (_first) {
//                 altText = altText.concat(' with ')
//                 _first = false;
//             } else {
//                 altText = altText.concat(', ')
//             }
//             altText = altText.concat(encodingObj.type + ' ' + encoding + '-axis')
//         }
//     }

//     if (attributeExistsAndChildHasValue(trackSingle.encodingSeparated.encodingField, 'x', 'type', 'genomic') || (attributeExistsAndChildHasValue(trackSingle.encodingSeparated.encodingField, 'y', 'type', 'genomic'))) {
//         altText = altText.concat(',  with ' + trackSingle.layout + ' genome,')
//     }
      

//     altText = altText.concat(' titled: ' + altSpec.title + '.');

//     if (attributeExists(trackSingle.data, 'binSize')) {
//         altText = altText.concat(' Data is binned in intervals of ' + trackSingle.data.binSize * 256 + ' bp.');
//     }

    
//     if (attributeExists(trackSingle.data, 'categories')) {
//         if (trackSingle.data.categories.length === 1) {
//             altText = altText.concat(' The only category shown is ' + trackSingle.data.categories[0] + '.');
//         } else {
//             altText = altText.concat(' The ' + trackSingle.data.categories.length + ' different categories shown are: ' + trackSingle.data.categories.slice(0, -1).join(', ') + ' and ' + trackSingle.data.categories.slice(-1) + '.');
//         }
//     }

//     altText = altText.charAt(0).toUpperCase() + altText.slice(1);
        
//     return altText;

// }