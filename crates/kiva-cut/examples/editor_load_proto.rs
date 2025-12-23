//! Example demonstrating loading an editor from JSON protocol
//!
//! This example shows how to:
//! 1. Create a simple composition and save it to JSON
//! 2. Load the composition from JSON back into an editor
//! 3. Export the loaded composition

use kiva_cut::{
    ExportType, Result,
    cut::{
        editor::{Editor, ExportOptions},
        segment::Segment,
    },
};

#[tokio::main]
async fn main() -> Result<()> {
    env_logger::init();

    println!("=== Editor Load from JSON Example ===");

    // Step 1: Create a simple composition and save to JSON
    println!("1. Creating initial composition...");

    let mut editor = Editor::default();

    // Add materials
    let video_material_id = editor.add_material("examples/metadata/in.mp4").await?;

    // Add track
    let video_track_id = editor.add_video_track();

    // Add segment to track
    editor.add_segment_to_track(
        &video_track_id,
        Segment::video(&video_material_id, (0, 5000).into(), (0, 5000).into())
            .position((100, 200).into())
            .scale((1280, 720).into()),
    )?;

    // Fix material parameters
    editor.fix_materials().await?;

    // Save to JSON
    let json_proto = editor.save_to_json()?;
    println!(
        "2. Saved composition to JSON ({} characters)",
        json_proto.len()
    );

    // Display first 200 characters of the JSON for inspection
    if json_proto.len() > 200 {
        println!("   JSON preview: {}...", &json_proto[..200]);
    } else {
        println!("   JSON: {}", json_proto);
    }

    // Step 2: Create a new editor and load from JSON
    println!("3. Creating new editor and loading from JSON...");

    let mut loaded_editor = Editor::default();

    // Load the composition from JSON
    loaded_editor.load_from_json(&json_proto)?;
    println!("4. Successfully loaded composition from JSON");

    // Step 3: Export the loaded composition
    println!("5. Exporting loaded composition...");

    match loaded_editor
        .export(ExportOptions::new(
            "examples/metadata/editor_load_proto/loaded_output.mp4",
            ExportType::Video,
        ))
        .await
    {
        Ok(()) => println!("6. Export completed successfully: loaded_output.mp4"),
        Err(e) => {
            println!("Export failed: {}", e);
            return Err(e);
        }
    }

    // Step 4: Demonstrate that we can save the loaded editor again
    println!("7. Saving loaded editor back to JSON...");
    let reloaded_json = loaded_editor.save_to_json()?;
    println!(
        "8. Reloaded JSON length: {} characters",
        reloaded_json.len()
    );

    // Compare the two JSON strings to show they represent the same composition
    if json_proto == reloaded_json {
        println!("9. ✓ Original and reloaded JSON are identical");
    } else {
        println!(
            "9. ⚠ Original and reloaded JSON differ (this might be expected due to formatting)"
        );
    }

    println!("=== Editor Load from JSON Example Completed ===");
    Ok(())
}
