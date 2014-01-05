(function($) {

  //
  // Fonctions utilitaires
  //

  // Décale d'un indice vers la gauche le tableau et replace le premier élément
  // en fin de tableau.

  function rotate(array) {
    var newArray;
    newArray = array.slice(1)
    newArray.push(array[0])
    return newArray;
  };

  // La fonction headers retourne un tableau contenant les trois
  // premières lettres de chaque jour de la semaine.

  function headers() {
    var weekdays = moment.langData(moment.lang())._weekdays;
    return rotate($.map(weekdays, function(d){ return d.slice(0, 3); }));
  };

  // La fonction weekCount retourne le nombre de semaines a afficher
  // dans un mois.

  function weekCount(someMoment) {
    var count, nextMonth, cursor;
    count     = 0;
    nextMonth = moment(someMoment).add(1, 'month');
    cursor    = moment(someMoment).isoWeekday(1);

    while(cursor.isBefore(nextMonth)) {
      cursor = cursor.add(1, 'week');
      count  = count + 1;
    }

    return count;
  };


  //
  // Comportement de notre widget
  //

  function Calendar(container, options) {
    var _this = this;

    this.container = container;
    this.options = options;
    this.currentMoment = options.begin;

    this.initTable();

    // Déclencer l'évènement eventClicked lors d'un click
    // sur un élément contenant un évènement.

    this.table.on("click", "tbody td.bc-event", function() {
      var event = $(this).data("bcEvent");
      container.trigger("eventClicked", [event]);
    });

    this.table.on("click", "thead th.bc-next", function() { _this.nextMonth() });
    this.table.on("click", "thead th.bc-prev", function() { _this.prevMonth() });

    this.draw();
  };

  Calendar.prototype.initTable = function() {
    if (this.table) return;

    var thead, days;

    // Construction de l'entête

    thead = $("<thead><tr><th class=\"bc-prev\">&lt;</th><th colspan=\"5\" class=\"bc-month\"></th><th class=\"bc-next\">&gt;</th></tr></thead>");
    days  = $("<tr></tr>")
    $.each(headers(), function(_, day) {
      days.append("<th>" + day + "</th>")
    });
    thead.append(days)

    this.tbody = $("<tbody></tbody>")
    this.table = $("<table class=\"bc-table\"></table>");
    this.table.append(thead);
    this.table.append(this.tbody);
    this.container.append(this.table)
  };

  Calendar.prototype.nextMonth = function() {
    this.currentMoment.add(1, 'month');
    this.draw();
  };

  Calendar.prototype.prevMonth = function() {
    this.currentMoment.subtract(1, 'month');
    this.draw();
  };

  // La méthode suivante est plutôt longue, ce n'est pas l'important ici
  // mais il est possible de la diviser en fonctions plus spécifiques.

  Calendar.prototype.draw = function() {
    var _this = this;
    this.getEvents(function(events) {
      var currentWeekNumber, lastWeekNumber, weekNumber, weekDay, tr, td, cursor, i, date;

      _this.tbody.detach()
      _this.tbody.html('')

      currentWeekNumber = _this.currentMoment.isoWeek()
      lastWeekNumber    = weekCount(_this.currentMoment) + currentWeekNumber

      for (weekNumber = currentWeekNumber; weekNumber < lastWeekNumber; weekNumber++) {
        tr = $('<tr></tr>');

        for (weekDay = 1; weekDay <= 7; weekDay++) {
          cursor = moment(_this.currentMoment).isoWeek(weekNumber).isoWeekday(weekDay)

          td = $('<td></td>');

          if (_this.currentMoment.month() !== cursor.month()) {
            td.toggleClass('bc-inactive')
          } else {
            date = cursor.date();
            for (i = 0; i < events.length; i++) {
              if (date === events[i].date.date()) {
                td.toggleClass('bc-event')
                td.data('bcEvent', events[i])
              }
            }
          }

          td.html(cursor.date())

          tr.append(td)
        }

        _this.tbody.append(tr)
      }

      _this.table.find(".bc-month").html(_this.currentMoment.format("MMMM YYYY"));

      _this.table.append(_this.tbody)
    });
  };

  Calendar.prototype.getEvents = function(callback) {
    this.options.events(this.currentMoment, callback);
  }


  // Fonctions de notre plugin

  function bCalendarInit(options) {

    // Merge default params into options

    options = $.extend({}, {
      begin: moment().date(1),
      events: function(_, callback){ callback([]) }
    }, options);

    var calendar = new Calendar(this, options);
    this.data('bCalendar', calendar);
  };

  function bCalendarMethodCall() {
    var calendar = this.data('bCalendar');

    if (calendar) {
      var methodName = arguments[0];
      var methodArgs = arguments.slice(1);
      return calendar[methodName].apply(calendar, methodArgs);
    }

    throw "Please init the bCalendar before calling methods on it.";
  };


  // Branchement dans jQuery

  $.fn.bCalendar = function(optionsOrMethod) {

    // Utiliser une même méthode pour l'intialisation ou les méthodes
    // puis redistribuer selon le type du premier argument.

    if (typeof optionsOrMethod === "string")
      bCalendarMethodCall.apply(this, arguments);
    else
      bCalendarInit.apply(this, arguments)

    // Permettre le chainage en retournant this

    return this;
  };

})(jQuery);
