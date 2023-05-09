//function inspired from 1800 to load navbar and footer into html
function loadSkeleton(){
    console.log("testing");
    console.log($('#header').load('./templates/header.html'));
    console.log($('#footer').load('./templates/footer.html'));
}
loadSkeleton();