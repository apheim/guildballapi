

function getCharacters(){
  fetch('/api/characters', {
  	method: 'get'
  }).then(function(response) {
    response.json().then(function(data) {
        console.log(data);
        vm.characters(data);
      });
  });
}



function getCharacter(id){
  fetch('/api/Characters/' + id + '?filter={"include": ["Team",  "Keywords", "CharacterPlays", "CharacterTraits",  { "PlayBookColumns" :  {"PlaybookResults" : {   "PlaybookResultActions" : "Action"    } }}]}',
  {
  	method: 'get'
  }).then(function(response) {
    response.json().then(function(data) {
        console.log(data);
        vm.selectedCharacterData(data);
      });
  });
}


var vm = {
  characters : ko.observableArray(),
  selectedCharacter: ko.observable(),
  selectCharacter: function(character){
    console.log(character);
    vm.selectedCharacter(character);
    getCharacter(character.id);
  },
  selectedCharacterData: ko.observable()
};

ko.applyBindings(vm);

getCharacters();
