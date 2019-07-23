var cal = {
    mName: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"], // Ay isimleri
    data: null, // Görev kaydı
    eventInfo: {//görev şablonu
        "title": "",
        "date": "",
        "endDate": ""
    }, //günlük bilgi giriş şablonu
    sDay: 0, // Seçili günü tutar
    sMth: 0, // Seçili ayı tutar 
    sYear: 0, // Seçili yılı tutar
    lDay: 31, // Aydaki gün sayısını tutar
    startTime: null, //görev başlangıç zamanı
    endTime: null, //görev bitiş zamanı
    ctrlTime: 0, //Başlangıç tarihinin bitiş tarihinden sonra olmaması için kullanıyoruz
    ntd: 1, //gün içinde bulunan toplam görev sayısı
    ntdEvt: {}, //gün içindeki görev sayısı save'de kullanıyoruz
    order: 0,//görev seçim kontrolü
    /* FONKSYONLAR */
    takvim: function () {
        // seçilen yıl-ay bilgisine göre takvim oluşturur

        // Date objesinde, aylar ve günler dizi içinde tutulduğu için haftanın ilk günü
        //ve yılın ilk ayı 0'ıncı indextedir.
        cal.sMth = parseInt(document.querySelector(".selector:nth-child(1)").value);
        // seçilen ay bilgisini alır
        cal.sYear = parseInt(document.querySelector(".selector:nth-child(2)").value);
        // seçilen yıl bilgisini alır
        var daysInMth = new Date(cal.sYear, cal.sMth + 1, 0).getDate(),
            // gün bilgisine sıfır yazdığımız için önceki ayın son günü döner
            startDay = new Date(cal.sYear, cal.sMth, 1).getDay(),
            //ayın başlangıç gününü haftanın gününe döndürür 1=>pazaretsi..6=>c.ertesi,0=>pazar
            endDay = new Date(cal.sYear, cal.sMth, daysInMth).getDay();
        //ayın son gününden haftanın son gününe ulaştık
        cal.lDay = daysInMth; //ayın son günü

        // LOCALSTORAGE'DAN KAYITLARIN ALINMASI
        cal.getEvents();

        // ÇİZİM İÇİN TAKVİMDE Kİ BOŞ BIRAKILACAK KISIMLARIN HESABI
        // Takvimin Başında boş kalacak kısmın belirlenmesi
        var squares = [];
        if (startDay != 1) {
            var blanks = startDay == 0 ? 7 : startDay;
            for (var i = 1; i < blanks; i++) {
                squares.push("b");
            }
        }
        // takvimde günlerin bulunacağı kısımın belirlenmesi
        for (var i = 1; i <= daysInMth; i++) {
            squares.push(i);
        }
        // Takvimin sonunda boş kalacak kısımların belirlenmesi
        if (endDay != 0) {
            var blanks = 7 - endDay;
            for (var i = 0; i < blanks; i++) {
                squares.push("b");
            }
        }
        // ÇİZİM KISMI
        // cal-container içerisine takvimi çizmek için tablo oluşturur 
        var container = document.getElementById("cal-container"),
            cTable = document.createElement("table");
        cTable.id = "calendar";
        container.innerHTML = "";
        container.appendChild(cTable);

        //Tablonun ilk satırına haftanın günlerini ekliyoruz
        var cRow = document.createElement("tr"),
            cCell = null,
            days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

        for (var d in days) {
            cCell = document.createElement("td");
            cCell.innerHTML = days[d];
            cRow.appendChild(cCell);
        }
        cRow.classList.add("head");
        cTable.appendChild(cRow);

        // Takvime seçilen ayın günlerinin eklenmesi
        var total = squares.length;
        cRow = document.createElement("tr");
        cRow.classList.add("day");
        for (var i = 0; i < total; i++) {
            cCell = document.createElement("td");

            if (squares[i] == "b") {
                cCell.classList.add("blank");
            } else {
                cCell.innerHTML = "<div name=" + squares[i] + " class='dd'>" + squares[i] + "</div>"
                if (cal.data[squares[i]]) {
                    cal.ntdEvt = cal.data[squares[i]]
                    cal.ntd = cal.ntdEvt.length;
                    while (cal.ntd) {
                        cCell.innerHTML += "<div class='event'" + "id=" + cal.ntd + " ondblclick='cal.selectEvent(" + cal.ntd + ")'>" + cal.ntdEvt[cal.ntd]["title"] + "</div>";
                        cal.ntd--;
                    }
                    cal.ntd = cal.ntdEvt.length;
                }
                cCell.addEventListener("click", function () {
                    cal.show(this);
                });
            }
            cRow.appendChild(cCell);
            if (i != 0 && (i + 1) % 7 == 0) { //7 gün dolunca alt satıra geçer
                cTable.appendChild(cRow);
                cRow = document.createElement("tr");
                cRow.classList.add("day");
            }
        }
        //görev süresi içerisindeki günlere görevi ekler
        cal.evtDuration();
        // Ekle/Düzenle kısmı seçim yapılıncaya kadar gösterilmez
        cal.close();
    },

    evtDuration: function () {
        //cal.evtDuration(): Görev süresini diğer günlere ekler
        var monthDays = document.querySelectorAll(".dd"); //ayın tüm günleri
        var tempDay;
        var tempStart;
        var tempFinish;
        var tempDate;
        var NextDayId;
        var nextDay;
        var EventId;

        monthDays.forEach(function (nDay) { //her gün için

            if (nDay.parentElement.querySelectorAll(".event")["length"] == 0) {
                return;
            } //event yoksa alttaki satırları yaptırmaz

            events = nDay.parentElement.querySelectorAll(".event"); //günün tüm eventleri

            events.forEach(function (event) { //her eventi diğre günlerine kopyala
                tempDay = nDay.textContent;
                EventId = parseInt(event.id);
                tempStart = new Date(cal.data[tempDay][EventId]["date"]).getDate() - 1;
                tempFinish = new Date(cal.data[tempDay][EventId]["endDate"]).getDate() - 1;
                tempDate = (tempFinish == 0 ? cal.lDay : tempFinish) - (tempStart);

                for (var a = 1; a <= tempDate; a++) { //event süresi kadar diğergünlere kopyala 
                    NextDayId = parseInt(tempDay) + a; //sonraki gün
                    nextDay = document.getElementsByName(NextDayId); //sonraki cell
                    nextDay = nextDay[0].parentElement;
                    var cEvent = document.createElement("div");
                    cEvent.setAttribute("class", "clon");
                    cEvent.innerHTML = cal.data[tempDay][EventId]["title"]
                    nextDay.appendChild(cEvent);
                }
            })
        })
    },

    getEvents: function () {
        //cal.getEvents():Bellekten seçilen ayın kayıtlarını alır
        cal.data = localStorage.getItem("cal-" + cal.sMth + "-" + cal.sYear);
        if (cal.data == null) {
            localStorage.setItem("cal-" + cal.sMth + "-" + cal.sYear, "{}");
            cal.data = {};
        } else {
            cal.data = JSON.parse(cal.data);
        }
    },

    selectEvent: function (e) {
        //cal.selectEvent():Seçilen görev bilgilerin getirir
        if (cal.sDay) {
            cal.close();
            cal.order++;
            cal.ntd = e;
            
            var tForm = "<h1>Düzenle</h1>";
            tForm += "<span id='evt-start'>Görev Başlangıcı:<br></span>";
            tForm += "<span id='evt-finish'>Görev bitiş:<br></span>";
            tForm += "<textarea id='evt-details' required>" + cal.ntdEvt[cal.ntd]["title"] +"</textarea>";
            tForm += "<input type='button' value='Kapat' onclick='cal.close()'/>";
            tForm += "<input type='button' value='Sil' onclick='cal.del()'/>";
            tForm += "<input type='submit' value='Kaydet'/>";

            let newForm = document.createElement("form");
            newForm.addEventListener("submit", cal.save);
            newForm.innerHTML = tForm;

            var container = document.getElementById("cal-event");
            container.innerHTML = ""; // Üstüne eklenmemesi için
            container.appendChild(newForm);

            var start = document.getElementById("evt-start"); //Görev başlangıç tarihi
            start.appendChild(addDays(cal.sDay, cal.lDay))
            start.appendChild(addMonths(cal.sMth));
            start.appendChild(addYears(cal.sYear));
            
            var finish = document.getElementById("evt-finish"); //Görev bitiş tarihi
            finish.appendChild(addDays(cal.sDay, cal.lDay))
            finish.appendChild(addMonths(cal.sMth));
            finish.appendChild(addYears(cal.sYear));

        }
    },

    ctrlData: function () {
        //cal.ctrlData():seçilen günün bilgilerini şablona ekler
        if (cal.data[cal.sDay]) { 
            cal.ntdEvt = cal.data[cal.sDay]
            cal.ntd = cal.ntdEvt["length"];
        } else {
            cal.ntdEvt = {};
            cal.ntd = 1;
            cal.ntdEvt["length"] = 0;
        }
    },

    show: function (el) {
        // cal.show() : Görev kayıt alanın gösterir
        // Seçilen gününde kayıtlı göreve ulaşmak için gün bilgisini alınır
        if (cal.order == 0) {
            cal.sDay = el.getElementsByClassName("dd")[0].innerHTML;
            cal.ctrlData();

            // GÖREV GİRİŞ FORMUNUN OLUŞTURULMASI
            var tForm = "<h1>" + (cal.data[cal.sDay] ? "Düzenle" : "Görev Ekle") + "</h1>";
            tForm += "<span id='evt-start'>Görev Başlangıcı:<br></span>";
            tForm += "<span id='evt-finish'>Görev bitiş:<br></span>";

            tForm += "<textarea id='evt-details' required>" + (cal.data[cal.sDay] ? cal.ntdEvt[(cal.ntd)]["title"] : "") + "</textarea>";
            tForm += "<input type='button' value='Kapat' onclick='cal.close()'/>";
            tForm += cal.ntdEvt[cal.ntd] ? "<input type='button' value='Sil' onclick='cal.del()'/>" : "";
            tForm += cal.ntdEvt[cal.ntd] ? "<input type='button' value='Yeni Görev' onclick='cal.addNew()'/>" : "";
            // yeni görev dememesi lazım ilkinde
            tForm += "<input type='submit' value='Kaydet'/>";

            let eForm = document.createElement("form");
            eForm.addEventListener("submit", cal.save);
            eForm.innerHTML = tForm;

            var container = document.getElementById("cal-event");
            container.innerHTML = ""; // Üstüne eklenmemesi için
            container.appendChild(eForm);

            var start = document.getElementById("evt-start"); //Görev başlangıç tarihi
            start.appendChild(addDays(cal.sDay, cal.lDay));
            start.appendChild(addMonths(cal.sMth));
            start.appendChild(addYears(cal.sYear));

            var finish = document.getElementById("evt-finish"); //Görev bitiş tarihi
            finish.appendChild(addDays(cal.sDay, cal.lDay))
            finish.appendChild(addMonths(cal.sMth));
            finish.appendChild(addYears(cal.sYear));

        } else {
            cal.order--;
        }
    },

    addNew: function () {
        // cal.addNew() : yeni görev ekler
        cal.close();
        cal.ntd++;
        cal.ntdEvt["length"] = cal.ntd;

        var tForm = "<h1>Görev Ekle</h1>";
        tForm += "<span id='evt-start'>Görev Başlangıcı:<br></span>";
        tForm += "<span id='evt-finish'>Görev bitiş:<br></span>";

        tForm += "<textarea id='evt-details' required></textarea>";
        tForm += "<input type='button' value='Kapat' onclick='cal.close()'/>";
        tForm += "<input type='button' value='Sil' onclick='cal.del()'/>";
        tForm += "<input type='submit' value='Kaydet'/>";

        let newForm = document.createElement("form");
        newForm.addEventListener("submit", cal.save);
        newForm.innerHTML = tForm;

        var container = document.getElementById("cal-event");
        container.innerHTML = ""; // Üstüne eklenmemesi için
        container.appendChild(newForm);

        var start = document.getElementById("evt-start"); //Görev başlangıç tarihi
        start.appendChild(addDays(cal.sDay, cal.lDay));
        start.appendChild(addMonths(cal.sMth));
        start.appendChild(addYears(cal.sYear));

        var finish = document.getElementById("evt-finish"); //Görev bitiş tarihi
        finish.appendChild(addDays(cal.sDay, cal.lDay))
        finish.appendChild(addMonths(cal.sMth));
        finish.appendChild(addYears(cal.sYear));
    },

    save: function (evt) {
        // cal.save() : Görevi kaydeder

        evt.stopPropagation();
        evt.preventDefault();
        cal.getTime();
        if (cal.ctrlTime < 0) {
            window.alert("Görev Bitiş tarihi başlangıçtan önce olamaz");

        } else {

            cal.eventInfo.title = document.getElementById("evt-details").value;
            cal.eventInfo.date = cal.startTime;
            cal.eventInfo.endDate = cal.endTime;
            if (!cal.ntdEvt["length"]) {
                cal.ctrlData(); //getTime dan alınan gün bilgisine göre kayıtları getirir
            }
            cal.ntdEvt[cal.ntd] = cal.eventInfo;
            cal.ntdEvt["length"] = (cal.ntdEvt["length"] == 0 ? 1 : cal.ntdEvt["length"]);
            cal.data[cal.sDay] = cal.ntdEvt;
            localStorage.setItem("cal-" + cal.sMth + "-" + cal.sYear, JSON.stringify(cal.data)); //serverda depolamak için stringe çeviriyoruz

        }
        cal.takvim();
    },

    getTime: function () {
        //getTıme():Şablona eklemek içi görev tarih bilgilerini hazırlar
        cal.sDay = parseInt(document.querySelector("#evt-start > select:nth-child(2)").value) + 1;
        cal.sMth = parseInt(document.querySelector("#evt-start > select:nth-child(3)").value);
        cal.sYear = parseInt(document.querySelector("#evt-start > select:nth-child(4)").value);
        cal.startTime = new Date(cal.sYear, cal.sMth, cal.sDay);

        var finDay = parseInt(document.querySelector("#evt-finish > select:nth-child(2)").value) + 1,
            finMonth = parseInt(document.querySelector("#evt-finish > select:nth-child(3)").value),
            finYear = parseInt(document.querySelector("#evt-finish > select:nth-child(4)").value);
        cal.endTime = new Date(finYear, finMonth, finDay);
        cal.ctrlTime = cal.endTime - cal.startTime;
        cal.sDay -= 1;
    },

    close: function () {
        // cal.close() : Görev işlem alanın ekrandan kaldırır

        document.getElementById("cal-event").innerHTML = "";
    },

    del: function () {
        // cal.del() : seçili görevi siler
        if (confirm("Görev Silinsin mi?")) {
            var end = cal.ntdEvt["length"];
            cal.ntdEvt[cal.ntd] = cal.ntdEvt[end];
            delete cal.ntdEvt[end];
            cal.ntdEvt["length"]--;
            if (cal.ntdEvt["length"] == 0) {
                delete cal.data[cal.sDay];
            }

            localStorage.setItem("cal-" + cal.sMth + "-" + cal.sYear, JSON.stringify(cal.data));
            cal.takvim();
        }
    }
};

function addButton(value) {
    var button = document.createElement("input");
    button.setAttribute("id", "cal-set");
    button.setAttribute("class", "selector");
    button.setAttribute("type", "button");
    button.setAttribute("value", value);
    return button;
}

function addDays(toDay, lastDay) {
    var dSlc = document.createElement("select");
    dSlc.className = "selector";
    for (var i = 1; i <= lastDay; i++) {
        var opt = document.createElement("option");
        opt.value = i;
        opt.innerHTML = i;
        if (i == toDay) {
            opt.selected = true;
        } //şuanki ayı seçer
        dSlc.appendChild(opt);
    }
    return dSlc;

}

function addMonths(month) {
    var mSlc = document.createElement("select");
    mSlc.className = "selector";
    for (var i = 0; i < 12; i++) {
        var opt = document.createElement("option");
        opt.value = i;
        opt.innerHTML = cal.mName[i];
        if (i == month) {
            opt.selected = true;
        } //şuanki ayı seçer
        mSlc.appendChild(opt);
    }
    mSlc.disabled = true;
    return mSlc;

}

function addYears(year) {
    var ySlc = document.createElement("select");
    ySlc.className = "selector";
    for (var i = year - 10; i <= year + 10; i++) {
        var opt = document.createElement("option");
        opt.value = i;
        opt.innerHTML = i;
        if (i == year) {
            opt.selected = true;
        } //şuanki yılı seçer
        ySlc.appendChild(opt);
    }
    ySlc.disabled = true;
    return ySlc;
}

// Ay-Zaman seçim ekranını hazırlar bulunulan ayı varsayılan olarak ayarlar
window.addEventListener("load", function () {
    // Şuan ki Tarih bilgisi
    var now = new Date(),
        nowMth = now.getMonth(),
        nowYear = now.getFullYear();

    var mth = document.getElementById("cal-date");
    var a=addMonths(nowMth); // Ay seçim alanının oluşturulması
    a.disabled=false
    mth.appendChild(a);
    var a=addYears(nowYear); // Ay seçim alanının oluşturulması
    a.disabled=false
    mth.appendChild(a); // Yıl seçim alanın oluşturulması
    mth.appendChild(addButton("Göster"));


    //seçilen ayın takvimini açar
    document.getElementById("cal-set").addEventListener("click", cal.takvim);
    cal.takvim();
});
