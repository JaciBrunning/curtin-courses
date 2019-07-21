# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2019_07_21_102230) do

  create_table "course_units", force: :cascade do |t|
    t.integer "course_id"
    t.integer "unit_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "planned_period"
    t.integer "planned_level", default: 0
    t.boolean "optional", default: false
    t.index ["course_id", "unit_id", "planned_period"], name: "index_course_units_uniq", unique: true
    t.index ["course_id"], name: "index_course_units_on_course_id"
    t.index ["unit_id"], name: "index_course_units_on_unit_id"
  end

  create_table "courses", force: :cascade do |t|
    t.string "code"
    t.string "name"
    t.string "url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "stream_parent_id"
    t.index ["code"], name: "index_courses_on_code", unique: true
    t.index ["stream_parent_id"], name: "index_courses_on_stream_parent_id"
  end

  create_table "unit_availabilities", force: :cascade do |t|
    t.integer "unit_id"
    t.string "year"
    t.string "period"
    t.string "location"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["unit_id", "year", "period", "location"], name: "unit_avails_idx", unique: true
    t.index ["unit_id"], name: "index_unit_availabilities_on_unit_id"
  end

  create_table "units", force: :cascade do |t|
    t.string "code"
    t.string "name"
    t.string "url"
    t.string "prereqs"
    t.float "credits"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "error"
    t.string "abbrev"
    t.boolean "freeform", default: false
    t.string "freeform_period"
    t.index ["code"], name: "index_units_on_code", unique: true
  end

end
